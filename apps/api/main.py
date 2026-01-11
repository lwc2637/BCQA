import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add packages/checklist-engine to path if not installed
# In Docker, we install it. Locally, we might need this.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../packages/checklist-engine")))

from .database import engine, Base
from .routers import templates, runs, health

# Create DB tables (Simple migration for Stage 1)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BCQA API", version="1.0.0")

# CORS
origins_env = os.getenv("CORS_ALLOW_ORIGINS")
origins = (
    [o.strip() for o in origins_env.split(",") if o.strip()]
    if origins_env
    else [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Ensure exports directory exists
EXPORT_DIR = "exports"
if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)

app.mount("/exports", StaticFiles(directory=EXPORT_DIR), name="exports")

app.include_router(health.router)
app.include_router(templates.router)
app.include_router(runs.router)

@app.get("/")
def root():
    return {"message": "Welcome to BCQA API"}
