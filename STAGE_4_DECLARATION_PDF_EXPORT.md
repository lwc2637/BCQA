# docs/stages/STAGE_4_DECLARATION_PDF_EXPORT.md
# Stage 4 — Declaration + PDF Export

## Objective
Gate submission with declaration and generate audit PDFs.

## Scope
- Declaration statement + signature capture (SVG)
- Validation gate: required answers/photos
- Export queue + progress UI
- PDF generation (Playwright) + artifact storage (MinIO)

## Acceptance criteria
- Export locked until declaration signed
- Declaration sets status=submitted
- PDF includes metadata, Q&A, photos, declaration + signature
