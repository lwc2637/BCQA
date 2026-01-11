# docs/03_API_CONTRACT.md
# API Contract — BCQA (v1)

## Conventions
- JSON over HTTPS
- Auth: Bearer JWT
- Errors: `{ "error": { "code": "...", "message": "...", "details": ... } }`
- Idempotency:
  - Answers are idempotent via PUT upsert
  - Media registration is idempotent per (run_id, question_id, kind, object_key)

---

## Auth
### POST /auth/login
Request:
```json
{ "email": "leo@example.com", "password": "..." }
Response:

json
Copy code
{ "token": "JWT...", "user": { "id": "...", "name": "Leo", "role": "engineer" } }
Templates
GET /templates
Response:

json
Copy code
[
  { "id": "cel_das_v1", "name": "CELs — DAS", "version": "1.0.0" },
  { "id": "cel_dot_v1", "name": "CELs — DOT", "version": "1.0.0" }
]
GET /templates/{templateId}
Returns full template definition JSON.

Runs (Checklist instances)
POST /runs
Request:

json
Copy code
{
  "template_id": "cel_das_v1",
  "p_ref": "1234567",
  "site_name": "12345 — TEST",
  "engineer_name": "LEO",
  "contractor_name": "Virtua",
  "supplier_name": "Ericsson",
  "visit_date": "2026-01-10",
  "tech_bands": [1800, 2600],
  "ap_count": 2,
  "address": null
}
Response:

json
Copy code
{ "id": "uuid...", "status": "draft" }
GET /runs
Query: status, search, limit, cursor

GET /runs/{runId}
Returns run metadata plus:

progress by bucket

answers map

media list

declaration state

export artifacts

PATCH /runs/{runId}
Updates metadata fields.

Answers
PUT /runs/{runId}/answers/{questionId}
Request:

json
Copy code
{ "state": "fail", "comment": "Label missing at BBU" }
Response:

json
Copy code
{ "ok": true }
Server validation:

comment required when state=fail

Media (photos)
POST /runs/{runId}/media/presign
Request:

json
Copy code
{ "question_id": "Q-0012", "kind": "pre", "content_type": "image/jpeg" }
Response:

json
Copy code
{
  "upload_url": "https://minio...signed...",
  "object_key": "runs/{runId}/Q-0012/pre/20260110T...jpg"
}
POST /runs/{runId}/media/complete
Request:

json
Copy code
{
  "question_id": "Q-0012",
  "kind": "pre",
  "object_key": "runs/...",
  "size_bytes": 345678
}
Response:

json
Copy code
{ "id": "uuid...", "thumb_key": null }
Declaration
POST /runs/{runId}/declare
Request:

json
Copy code
{ "signed_by": "LEO", "signature_svg": "<svg>...</svg>" }
Response:

json
Copy code
{ "status": "submitted" }
Server validates:

required answers complete

required photos present

Export
POST /runs/{runId}/export
Response:

json
Copy code
{ "job_id": "uuid..." }
GET /runs/{runId}/export
Response:

json
Copy code
{ "pdf_url": "https://minio...signed..." }
Health
GET /healthz

GET /readyz