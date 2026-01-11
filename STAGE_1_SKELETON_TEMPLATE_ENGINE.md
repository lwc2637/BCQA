# docs/stages/STAGE_1_SKELETON_TEMPLATE_ENGINE.md
# Stage 1 — Skeleton + Template Engine

## Objective
Stand up the Docker stack and render DAS/DOT templates into bucket tiles.

## Scope
- Repo structure + Docker Compose:
  - web (Next.js)
  - api (FastAPI)
  - worker (Celery)
  - postgres
  - redis
  - minio
  - reverse proxy
- Health checks
- Template loader + seed templates
- Create checklist (metadata) → run created
- Run dashboard with bucket tiles + progress calculation

## Out of scope
Photos, PDF export, offline sync

## Acceptance criteria
- `docker compose up` works without manual intervention
- Create DAS or DOT run and see correct buckets
- Completion % is computed (even if all 0% initially)
