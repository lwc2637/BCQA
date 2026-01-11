# docs/02_DATA_MODEL.md
# Data Model — BCQA

## Goals
- Template-driven checklists with stable IDs
- Fast progress queries and safe export
- Media stored in object storage; DB stores metadata and links

---

## Entities

### User
- id (uuid)
- name
- email (unique)
- role (engineer/admin) — keep simple for v1
- created_at

### ChecklistTemplate
- id (string): e.g., `cel_das_v1`
- name
- version (semver)
- definition_json (jsonb): buckets/questions/rules
- created_at

### ChecklistRun
- id (uuid)
- template_id (fk → ChecklistTemplate)
- status: draft | in_progress | submitted | exported
- p_ref
- site_name
- address (nullable)
- engineer_name
- contractor_name (nullable)
- supplier_name (nullable)
- visit_date
- tech_bands (jsonb array): [1800, 2600, 3500]
- ap_count (int)
- created_at, updated_at, submitted_at

### ChecklistAnswer
- id (uuid)
- run_id (fk → ChecklistRun)
- question_id (string; stable within template version)
- state: pass | fail | na | unanswered
- comment (nullable; required when state=fail)
- updated_at
Unique constraint: (run_id, question_id)

### MediaAsset
- id (uuid)
- run_id (fk)
- question_id (string)
- kind: pre | post | other
- s3_key (string)
- thumb_key (nullable)
- content_type
- size_bytes
- quality_score (nullable)
- exif_json (nullable)
- created_at

### Declaration
- id (uuid)
- run_id (fk, unique)
- statement_version (string)
- signed_by
- signed_at
- signature_svg (text)

### ExportArtifact
- id (uuid)
- run_id (fk)
- pdf_s3_key
- created_at
- created_by

---

## Status lifecycle
- draft: created, not started
- in_progress: at least one answer or photo exists
- submitted: declaration signed
- exported: at least one PDF artifact generated

---

## ERD (high-level)
ChecklistRun ─┬─ ChecklistAnswer
             ├─ MediaAsset
             ├─ Declaration
             └─ ExportArtifact

---

## Template versioning rule
Templates are **immutable** once published. Any change becomes a **new template ID/version**.
Runs always reference exactly one template version for auditability.