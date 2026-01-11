# docs/05_PDF_SPEC.md
# PDF Spec — BCQA

## Goal
Generate an **audit-friendly PDF** proving:
- Who did the QA, where, when
- What was checked (template version)
- Pass/fail/NA + comments
- Photo evidence pre/post
- Declaration sign-off

---

## PDF structure
1. Cover page
   - Site, P-Ref, engineer, supplier/contractor
   - Visit date
   - Template name + version
   - Tech bands + AP count

2. Summary page
   - Bucket completion
   - Pass/Fail/NA counts
   - Failed items list (with section references)

3. Detailed checklist
   - Bucket sections
   - Each question:
     - state badge
     - comment (if fail)
     - pre/post thumbnails (if present)

4. Declaration page
   - Statement text
   - Signed by/date
   - Signature (SVG)

---

## Rendering pipeline
- Build HTML report template (Jinja or SSR)
- Render to PDF using Playwright (Chromium)
- Resize/compress images for PDF while keeping labels readable
- Store PDF in MinIO; record ExportArtifact in Postgres

---

## Versioning
- PDF must record `template_id` and `template_version`
- Runs always export against the template version they started with
