FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy local packages
COPY packages/checklist-engine /packages/checklist-engine
RUN pip install -e /packages/checklist-engine

# Copy app code
COPY apps/api /app/apps/api
# Also copy templates to a known location for the loader
COPY packages/templates /app/packages/templates

ENV PYTHONPATH=/app
ENV TEMPLATES_DIR=/app/packages/templates

CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
