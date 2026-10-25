from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Engine configuration
connect_args = {}
engine_kwargs = {"echo": False, "future": True}

db_url = settings.get_database_url()

# Graceful fallback if placeholder is still present in .env
if "[YOUR-PASSWORD]" in db_url:
    print("[EviLock] NOTICE: '[YOUR-PASSWORD]' placeholder detected in DATABASE_URL.")
    print("[EviLock] Using local SQLite database until you paste your Supabase password into .env.")
    import os
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../evilock_dev.db")).replace(os.sep, "/")
    db_url = f"sqlite:///{sqlite_path}"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Cloud PostgreSQL (Supabase, Neon, AWS RDS)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
