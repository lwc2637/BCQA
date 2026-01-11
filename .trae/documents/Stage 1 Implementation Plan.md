# Stage 1: Skeleton + Template Engine Implementation Plan

I will build the "BCQA" product foundation following the specifications in `docs/STAGE_1_SKELETON_TEMPLATE_ENGINE.md` and related documents.

## 1. Monorepo & Shared Packages
- [ ] Create project structure (`apps/`, `packages/`, `infra/`).
- [ ] **Package: `checklist-engine`**
    - Create a Python package for template validation.
    - Implement Pydantic models based on `docs/09_TEMPLATE_SCHEMA.md`.
    - Implement a strict JSON loader that validates against the schema.
- [ ] **Package: `templates`**
    - Create `packages/templates/cel_das_v1.json` (DAS).
    - Create `packages/templates/cel_dot_v1.json` (DOT).
    - Ensure correct structure: Buckets -> Groups -> Questions.

## 2. Backend API (`apps/api`)
- [ ] Initialize FastAPI project.
- [ ] **Database**:
    - Set up Postgres connection (SQLAlchemy).
    - Define `ChecklistRun` model (matching `docs/02_DATA_MODEL.md`).
- [ ] **Endpoints**:
    - `GET /healthz`, `GET /readyz`.
    - `GET /templates`: List valid templates (loaded from `packages/templates`).
    - `GET /templates/{id}`: Return validated template JSON.
    - `POST /runs`: Create a new run record.
    - `GET /runs`: List runs.
    - `GET /runs/{id}`: Return run details with template summary.
- [ ] **Validation**: Ensure app fails to start or logs errors if templates are invalid.

## 3. Frontend PWA (`apps/web`)
- [ ] Initialize Next.js 14+ (App Router) project.
- [ ] **UI System**:
    - Install Tailwind CSS, shadcn/ui, Framer Motion.
    - Implement `ThemeProvider` (Dark/Light mode).
- [ ] **Pages**:
    - **Home (`/`)**: "New Checklist" button, Recent Runs list.
    - **Create Run (`/runs/new`)**: Form for metadata (Template, Site, Engineer, etc.).
    - **Run Dashboard (`/runs/[id]`)**: Bucket tiles with progress indicators.
    - **Bucket Detail (`/runs/[id]/b/[bucketId]`)**: Read-only list of questions (stub).

## 4. Infrastructure & Docker
- [ ] **Dockerfiles**: Create optimized Dockerfiles for `apps/web` and `apps/api`.
- [ ] **Docker Compose**:
    - Define services: `web`, `api`, `postgres`, `redis` (optional), `minio` (optional).
    - Configure networking and environment variables.
- [ ] **Documentation**:
    - Create `docs/STAGE_1_COMPLETION_REPORT.md`.
    - Update `README.md` with run instructions.

## 5. Verification
- [ ] Verify `docker compose up` starts all services correctly.
- [ ] Verify API health and template serving.
- [ ] Verify Frontend flows: Create Run -> Dashboard -> Bucket Detail.
