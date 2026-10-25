import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "EviLock - Secure Legal & Investigation Document Management"
    TAGLINE: str = "Protecting Evidence. Preserving Trust."
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "evilock-super-secure-cryptographic-signing-key-2026")
    ALGORITHM: str = "HS256"
    SESSION_COOKIE_NAME: str = "evilock_session"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Database: Absolute path to canonical project SQLite database, or PostgreSQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../evilock_dev.db')).replace(os.sep, '/')}"
    )

    # Document Storage
    STORAGE_LOCAL_PATH: str = os.getenv(
        "STORAGE_LOCAL_PATH",
        "/tmp/evilock_vault" if os.getenv("VERCEL") else os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/vault"))
    )
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "xlsx", "csv", "txt", "jpg", "jpeg", "png", "zip"]

    # Integrity Ledger Genesis
    LEDGER_GENESIS_HASH: str = "0000000000000000000000000000000000000000000000000000000000000000"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    def get_allowed_origins(self) -> List[str]:
        env_origins = os.getenv("ALLOWED_ORIGINS")
        if env_origins:
            if env_origins.strip() == "*":
                return ["*"]
            return [o.strip() for o in env_origins.split(",") if o.strip()]
        return self.ALLOWED_ORIGINS

    def get_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure storage directory exists
os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)
