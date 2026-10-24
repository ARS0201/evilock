from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Engine configuration
connect_args = {}
engine_kwargs = {"echo": False, "future": True}

db_url = settings.get_database_url()
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Cloud PostgreSQL (Neon, Supabase, Render, Railway, AWS RDS)
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
