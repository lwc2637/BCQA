import os
from fastapi import APIRouter, HTTPException
from checklist_engine import TemplateLoader

router = APIRouter(prefix="/templates", tags=["templates"])

TEMPLATES_DIR = os.getenv("TEMPLATES_DIR", "../../packages/templates")
loader = TemplateLoader(TEMPLATES_DIR)

@router.get("/")
def list_templates():
    templates = loader.load_all()
    # Return simplified metadata
    return [t.meta for t in templates]

@router.get("/{template_id}")
def get_template(template_id: str):
    template = loader.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template
