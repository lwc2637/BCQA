# BCQA - IBS Quality Assurance Platform

BCQA is a mobile-first PWA for engineers to run DAS/DOT IBS QA checklists.

## Stage 1: Skeleton + Template Engine

This release includes the foundational structure, template engine, and core run management.

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)

### Getting Started

1. **Clone the repository** (if not already done).
2. **Navigate to the docker infrastructure directory**:
   ```bash
   cd infra/docker
   ```
3. **Start the stack**:
   ```bash
   docker-compose up --build
   ```

   This will start:
   - **Web App**: http://localhost:3000
   - **API**: http://localhost:8000
   - **Postgres**: localhost:5432

### Usage

1. Open http://localhost:3000 on your mobile or desktop.
2. Click "New BCQA Checklist".
3. Select a template (DAS or DOT) and fill in the details.
4. Click "Save & Next" to view the Run Dashboard.
5. Click on bucket tiles to see the questions (Read-only for Stage 1).

### Troubleshooting

- **Containers fail to start**: Check logs with `docker-compose logs -f`.
- **Database connection error**: Ensure Postgres is healthy (`docker-compose ps`).
- **Templates not showing**: Ensure `packages/templates` contains valid JSON files.

### Development

- **Frontend**: `apps/web` (Next.js)
- **Backend**: `apps/api` (FastAPI)
- **Shared**: `packages/checklist-engine` (Python)
- **Templates**: `packages/templates` (JSON)

To add a new template, simply add a valid JSON file to `packages/templates/`.
