# docs/07_SECURITY.md
# Security — BCQA (v1)

## Data sensitivity
Photos may contain operational details (labels, access equipment, serials). Treat all data as sensitive operational information.

---

## Authentication
- JWT bearer tokens (v1)
- v2 option: SSO/enterprise auth

---

## Authorisation (v1 roles)
- engineer: CRUD own runs
- admin: CRUD all runs + manage templates

---

## Storage security
- MinIO private buckets (no public access)
- Presigned URLs for upload/download (short expiry)
- Store object keys in DB; do not store permanent URLs

---

## Transport security
- TLS termination at reverse proxy in production
- HSTS (prod)

---

## Audit logging (v1.1)
Record events:
- run created
- answer changed (question_id, from/to)
- media uploaded
- declaration signed
- export generated

---

## Privacy controls (optional)
- One-tap blur tool for sensitive details
- Retention policy documented (project decision)
md
Copy code
