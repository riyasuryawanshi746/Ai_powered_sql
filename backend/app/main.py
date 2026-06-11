"""
FastAPI application entry point.
Sets up CORS, routers, and startup events.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routers import upload, query, history

settings = get_settings()

app = FastAPI(
    title="AI SQL Analytics Assistant",
    description="Upload CSVs, ask questions in plain English, get SQL + charts + insights.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router)
app.include_router(query.router)
app.include_router(history.router)


# ─── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()
    os.makedirs(settings.upload_dir, exist_ok=True)
    print("✅ Database initialized")
    print(f"✅ Upload directory: {settings.upload_dir}")
    if not settings.groq_api_key:
        print("⚠️  WARNING: GROQ_API_KEY is not set!")
    else:
        print("✅ Groq API key configured")


# ─── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "groq_configured": bool(settings.groq_api_key),
    }


@app.get("/", tags=["root"])
def root():
    return {"message": "AI SQL Analytics Assistant API", "docs": "/docs"}