from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensure all models are registered with Base.metadata

from app.api.auth_routes import router as auth_router
from app.api.user_routes import router as user_router
from app.api.case_routes import router as case_router
from app.api.document_routes import router as document_router
from app.api.ledger_routes import router as ledger_router
from app.api.audit_routes import router as audit_router
from app.api.workflow_routes import router as workflow_router

from app.core.init_db import init_db

# Initialize database tables and seed if fresh
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="EviLock - Secure Digital Document Management and Evidence Integrity System",
    version=settings.VERSION,
    debug=settings.DEBUG
)

# CORS middleware with wildcard and origins support
origins = settings.get_allowed_origins()
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount API routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(case_router, prefix="/api")
app.include_router(document_router, prefix="/api")
app.include_router(ledger_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(workflow_router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "integrity_engine": "SHA-256 Tamper-Evident Hash Chain Active"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
