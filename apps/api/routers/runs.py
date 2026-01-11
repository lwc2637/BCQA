from fastapi import APIRouter, Depends, HTTPException, Response, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from typing import List, Optional
import os
import shutil
from datetime import datetime
import textwrap
from mimetypes import guess_extension
from urllib.parse import urlparse

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageOps

from ..database import get_db
from ..models import ChecklistRun, ChecklistAnswer, ChecklistPhoto
from ..schemas import RunCreate, RunUpdate, RunResponse, AnswerCreate, AnswerResponse, PhotoResponse, ExportRequest, ExportResponse
from .templates import loader # Reuse the loader instance

router = APIRouter(prefix="/runs", tags=["runs"])

def _normalized_image_extension(filename: Optional[str], content_type: Optional[str]) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".bmp", ".tif", ".tiff"}:
        return ".jpg" if ext == ".jpeg" else ext

    ct = (content_type or "").split(";")[0].strip().lower()
    ct_map = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
    }
    if ct in ct_map:
        return ct_map[ct]

    guessed = guess_extension(ct) or ""
    if guessed == ".jpe":
        return ".jpg"
    return guessed

def _uploads_file_path_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        parsed = urlparse(url)
        path = parsed.path if parsed.scheme else url
        if path.startswith("/uploads/"):
            return os.path.join("uploads", path[len("/uploads/"):])
        return None
    except Exception:
        return None

def _try_make_thumbnail(src_path: str, thumb_path: str, size: int = 512) -> bool:
    try:
        resample = Image.LANCZOS
        if hasattr(Image, "Resampling"):
            resample = Image.Resampling.LANCZOS
        with Image.open(src_path) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            thumb = ImageOps.fit(img, (size, size), method=resample)
            thumb.save(thumb_path, format="JPEG", quality=82, optimize=True)
        return True
    except Exception:
        return False

@router.post("/", response_model=RunResponse)
def create_run(run_in: RunCreate, db: Session = Depends(get_db)):
    # Verify template exists
    template = loader.get_template(run_in.template_id)
    if not template:
        raise HTTPException(status_code=400, detail=f"Invalid template_id: {run_in.template_id}")

    db_run = ChecklistRun(**run_in.dict())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

@router.put("/{run_id}", response_model=RunResponse)
def update_run(run_id: UUID, run_in: RunUpdate, db: Session = Depends(get_db)):
    run = db.query(ChecklistRun).filter(ChecklistRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft runs can be edited")

    if run_in.site_name is not None:
        run.site_name = run_in.site_name
    if run_in.template_id is not None:
        template = loader.get_template(run_in.template_id)
        if not template:
            raise HTTPException(status_code=400, detail=f"Invalid template_id: {run_in.template_id}")
        run.template_id = run_in.template_id
    if run_in.p_ref is not None:
        run.p_ref = run_in.p_ref
    if run_in.engineer_name is not None:
        run.engineer_name = run_in.engineer_name
    if run_in.contractor_name is not None:
        run.contractor_name = run_in.contractor_name
    if run_in.supplier_name is not None:
        run.supplier_name = run_in.supplier_name
    if run_in.visit_date is not None:
        run.visit_date = run_in.visit_date
    if run_in.tech_bands is not None:
        run.tech_bands = run_in.tech_bands
    if run_in.ap_count is not None:
        run.ap_count = run_in.ap_count
    if run_in.address is not None:
        run.address = run_in.address
        
    db.commit()
    db.refresh(run)
    return run

@router.get("/", response_model=List[RunResponse])
def list_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    runs = db.query(ChecklistRun).offset(skip).limit(limit).all()
    return runs


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_run(run_id: UUID, db: Session = Depends(get_db)):
    run = db.query(ChecklistRun).filter(ChecklistRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft runs can be deleted")

    db.delete(run)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{run_id}")
def get_run_details(run_id: UUID, db: Session = Depends(get_db)):
    run = db.query(ChecklistRun).filter(ChecklistRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    template = loader.get_template(run.template_id)
    if not template:
        # Should not happen if data integrity is maintained
        raise HTTPException(status_code=500, detail="Template definition missing")

    # Fetch answers
    answers = db.query(ChecklistAnswer).filter(ChecklistAnswer.run_id == run_id).all()
    answers_map = {a.question_id: a for a in answers}
    
    # Calculate progress per bucket
    buckets_view = []
    for bucket in template.buckets:
        total = 0
        answered = 0
        for group in bucket.groups:
            for q in group.questions:
                total += 1
                if q.question_id in answers_map and answers_map[q.question_id].value:
                    answered += 1
        
        pct = int((answered / total * 100) if total > 0 else 0)
        
        buckets_view.append({
            "bucket_id": bucket.bucket_id,
            "title": bucket.title,
            "icon": bucket.icon or template.ui.default_bucket_icon,
            "completion_percentage": pct,
            "total_questions": total,
            "answered_questions": answered
        })
    
    # Convert answers to simpler dict for frontend
    answers_data = {}
    for a in answers:
        photos = []
        for p in a.photos:
            photos.append({
                "id": str(p.id),
                "url": p.url,
                "thumbnail_url": p.thumbnail_url,
                "caption": p.caption
            })
        answers_data[a.question_id] = {
            "value": a.value,
            "comment": a.comment,
            "photos": photos
        }

    return {
        "run": RunResponse.model_validate(run),
        "template_summary": {
            "id": template.meta.template_id,
            "name": template.meta.name,
            "version": template.meta.version
        },
        "buckets": buckets_view,
        "answers": answers_data
    }

@router.post("/{run_id}/answers", response_model=AnswerResponse)
def update_answer(run_id: UUID, answer_in: AnswerCreate, db: Session = Depends(get_db)):
    run = db.query(ChecklistRun).filter(ChecklistRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    db_answer = db.query(ChecklistAnswer).filter(
        ChecklistAnswer.run_id == run_id,
        ChecklistAnswer.question_id == answer_in.question_id
    ).first()
    
    if db_answer:
        if answer_in.value is not None:
            db_answer.value = answer_in.value
        if answer_in.comment is not None:
            db_answer.comment = answer_in.comment
    else:
        db_answer = ChecklistAnswer(
            run_id=run_id,
            question_id=answer_in.question_id,
            value=answer_in.value,
            comment=answer_in.comment
        )
        db.add(db_answer)
        
    db.commit()
    db.refresh(db_answer)
    return db_answer

@router.post("/{run_id}/questions/{question_id}/photos", response_model=PhotoResponse)
async def upload_photo(
    run_id: UUID, 
    question_id: str, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # Ensure answer exists
    db_answer = db.query(ChecklistAnswer).filter(
        ChecklistAnswer.run_id == run_id,
        ChecklistAnswer.question_id == question_id
    ).first()
    
    if not db_answer:
        db_answer = ChecklistAnswer(
            run_id=run_id,
            question_id=question_id,
            value=None
        )
        db.add(db_answer)
        db.commit()
        db.refresh(db_answer)
        
    # Save file
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_id = str(uuid4())
    file_ext = _normalized_image_extension(file.filename, file.content_type)
    filename = f"{file_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"/uploads/{filename}"

    thumb_filename = f"{file_id}_thumb.jpg"
    thumb_path = os.path.join(UPLOAD_DIR, thumb_filename)
    thumbnail_url = f"/uploads/{thumb_filename}" if _try_make_thumbnail(file_path, thumb_path) else url
    
    # Create Photo record
    db_photo = ChecklistPhoto(
        id=UUID(file_id),
        answer_id=db_answer.id,
        url=url,
        file_path=file_path,
        thumbnail_url=thumbnail_url
    )
    
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    
    return db_photo

@router.delete("/{run_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(run_id: UUID, photo_id: UUID, db: Session = Depends(get_db)):
    photo = db.query(ChecklistPhoto).filter(ChecklistPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    # Delete file
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)

    thumb_path = _uploads_file_path_from_url(getattr(photo, "thumbnail_url", None))
    if thumb_path and os.path.exists(thumb_path) and os.path.normpath(thumb_path) != os.path.normpath(photo.file_path):
        os.remove(thumb_path)
        
    db.delete(photo)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{run_id}/photos/thumbnails/regenerate")
def regenerate_thumbnails(run_id: UUID, db: Session = Depends(get_db)):
    run = db.query(ChecklistRun).filter(ChecklistRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    photos = (
        db.query(ChecklistPhoto)
        .join(ChecklistAnswer, ChecklistPhoto.answer_id == ChecklistAnswer.id)
        .filter(ChecklistAnswer.run_id == run_id)
        .all()
    )

    updated = 0
    for photo in photos:
        if not photo.file_path or not os.path.exists(photo.file_path):
            continue
        file_id = str(photo.id)
        thumb_filename = f"{file_id}_thumb.jpg"
        thumb_path = os.path.join("uploads", thumb_filename)
        if _try_make_thumbnail(photo.file_path, thumb_path):
            photo.thumbnail_url = f"/uploads/{thumb_filename}"
            updated += 1

    if updated:
        db.commit()

    return {"updated": updated, "total": len(photos)}

@router.put("/{run_id}/photos/{photo_id}", response_model=PhotoResponse)
def update_photo_caption(run_id: UUID, photo_id: UUID, caption: str = Form(...), db: Session = Depends(get_db)):
    photo = db.query(ChecklistPhoto).filter(ChecklistPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    photo.caption = caption
    db.commit()
    db.refresh(photo)
    return photo

def _draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, max_width_chars: int, line_height: float):
    for line in textwrap.wrap(text, width=max_width_chars) or [""]:
        c.drawString(x, y, line)
        y -= line_height
    return y

def _draw_embedded_image(
    c: canvas.Canvas,
    image_path: str,
    x: float,
    y_top: float,
    max_w: float,
    max_h: float,
):
    reader = ImageReader(image_path)
    iw, ih = reader.getSize()
    if not iw or not ih:
        raise ValueError("Invalid image dimensions")
    scale = min(max_w / float(iw), max_h / float(ih))
    w = float(iw) * scale
    h = float(ih) * scale
    c.drawImage(reader, x, y_top - h, width=w, height=h, preserveAspectRatio=True, mask="auto")
    return y_top - h

@router.post("/{run_id}/export", response_model=ExportResponse)
def export_run(run_id: UUID, payload: ExportRequest, db: Session = Depends(get_db)):
    run = db.query(ChecklistRun).filter(ChecklistRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    template = loader.get_template(run.template_id)
    if not template:
        raise HTTPException(status_code=500, detail="Template definition missing")

    answers = db.query(ChecklistAnswer).filter(ChecklistAnswer.run_id == run_id).all()
    answers_map = {a.question_id: a for a in answers}

    EXPORT_DIR = "exports"
    os.makedirs(EXPORT_DIR, exist_ok=True)

    filename = f"run_{run_id}.pdf"
    file_path = os.path.join(EXPORT_DIR, filename)

    page_w, page_h = A4
    margin_x = 16 * mm
    margin_y = 16 * mm
    line_h = 5 * mm
    photo_x = margin_x + 10 * mm
    photo_max_w = page_w - margin_x - photo_x
    photo_max_h = 80 * mm

    c = canvas.Canvas(file_path, pagesize=A4)
    y = page_h - margin_y

    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin_x, y, "BCQA — PDF Export")
    y -= 10 * mm

    c.setFont("Helvetica", 10)
    y = _draw_wrapped(c, f"Site: {run.site_name}", margin_x, y, 110, line_h)
    y = _draw_wrapped(c, f"P-Ref: {run.p_ref}", margin_x, y, 110, line_h)
    y = _draw_wrapped(c, f"Engineer: {run.engineer_name}", margin_x, y, 110, line_h)
    y = _draw_wrapped(c, f"Template: {template.meta.name} (v{template.meta.version})", margin_x, y, 110, line_h)
    y = _draw_wrapped(c, f"Status: {run.status}", margin_x, y, 110, line_h)
    y = _draw_wrapped(c, f"Generated: {datetime.utcnow().isoformat()}Z", margin_x, y, 110, line_h)
    y -= 4 * mm

    if payload and payload.declaration_checks:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_x, y, "Declaration")
        y -= 7 * mm
        c.setFont("Helvetica", 10)
        for item in payload.declaration_checks:
            if y < margin_y + 20 * mm:
                c.showPage()
                y = page_h - margin_y
                c.setFont("Helvetica", 10)
            y = _draw_wrapped(c, f"[x] {item.label}", margin_x, y, 120, line_h)
        y -= 4 * mm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_x, y, "Checklist Answers")
    y -= 7 * mm

    c.setFont("Helvetica", 9)

    def render_photos(photos, y):
        if not photos:
            return y
        y = _draw_wrapped(
            c,
            f"Photos: {len(photos)}",
            margin_x + 6 * mm,
            y,
            110,
            line_h,
        )
        for p in photos:
            caption = (getattr(p, "caption", None) or "").strip()
            y_needed = (6 * mm if caption else 0) + photo_max_h + 8 * mm
            if y < margin_y + y_needed:
                c.showPage()
                y = page_h - margin_y
                c.setFont("Helvetica", 9)
            if caption:
                y = _draw_wrapped(c, f"Caption: {caption}", photo_x, y, 115, line_h)
                y -= 1 * mm
            try:
                local_path = getattr(p, "file_path", None)
                if not local_path or not os.path.exists(local_path):
                    raise FileNotFoundError(local_path or "")
                y = _draw_embedded_image(c, local_path, photo_x, y, photo_max_w, photo_max_h)
                y -= 4 * mm
            except Exception:
                y = _draw_wrapped(c, f"Photo: {getattr(p, 'url', '')}", photo_x, y, 115, line_h)
                y -= 2 * mm
        return y

    for bucket in template.buckets:
        if y < margin_y + 25 * mm:
            c.showPage()
            y = page_h - margin_y
            c.setFont("Helvetica", 9)

        c.setFont("Helvetica-Bold", 11)
        c.drawString(margin_x, y, bucket.title)
        y -= 6 * mm
        c.setFont("Helvetica", 9)

        if bucket.bucket_id == "access_points":
            ap_count = int(run.ap_count or 0)
            if ap_count > 0:
                if y < margin_y + 22 * mm:
                    c.showPage()
                    y = page_h - margin_y
                    c.setFont("Helvetica", 9)
                c.setFont("Helvetica-Bold", 10)
                y = _draw_wrapped(c, "AP Photos", margin_x, y, 120, line_h)
                c.setFont("Helvetica", 9)
                for idx in range(1, ap_count + 1):
                    ap_qid = f"AP-PHOTO-{idx}"
                    a_ap = answers_map.get(ap_qid)
                    photos_ap = list(a_ap.photos) if a_ap else []
                    if y < margin_y + 20 * mm:
                        c.showPage()
                        y = page_h - margin_y
                        c.setFont("Helvetica", 9)
                    y = _draw_wrapped(c, f"AP {idx}", margin_x + 6 * mm, y, 120, line_h)
                    y = render_photos(photos_ap, y)
                    y -= 3 * mm

        for group in bucket.groups:
            if y < margin_y + 20 * mm:
                c.showPage()
                y = page_h - margin_y
                c.setFont("Helvetica", 9)

            c.setFont("Helvetica-Bold", 10)
            y = _draw_wrapped(c, group.title, margin_x, y, 120, line_h)
            c.setFont("Helvetica", 9)

            for q in group.questions:
                a = answers_map.get(q.question_id)
                value = a.value if a and a.value else "—"
                comment = a.comment if a and a.comment else ""
                photos = list(a.photos) if a else []

                if y < margin_y + 20 * mm:
                    c.showPage()
                    y = page_h - margin_y
                    c.setFont("Helvetica", 9)

                y = _draw_wrapped(
                    c,
                    f"{q.question_id} — {q.text}",
                    margin_x,
                    y,
                    120,
                    line_h,
                )
                y = _draw_wrapped(c, f"Answer: {value}", margin_x + 6 * mm, y, 110, line_h)
                if comment:
                    y = _draw_wrapped(c, f"Comment: {comment}", margin_x + 6 * mm, y, 110, line_h)
                y = render_photos(photos, y)

                y -= 2 * mm

    c.save()

    base_url = os.getenv("API_URL", "http://localhost:8000")
    pdf_url = f"{base_url}/exports/{filename}"
    return {"pdf_url": pdf_url}
