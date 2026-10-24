#!/usr/bin/env python3
"""
EviLock Global Database Provisioner & Integrity Auditor
Connects to any remote PostgreSQL database (Neon, Supabase, Render, Railway, AWS RDS, etc.),
provisions the schema, seeds initial legal roles and demo cases, and verifies cryptographic continuity.
"""

import os
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.core.config import settings
from app.core.database import Base
from app.core.init_db import init_db
from app.services.ledger_service import LedgerService
from app.models.user import User, Role
from app.models.document import Document
from app.models.ledger import IntegrityLedger

def deploy_global_database(database_url: str):
    print("=" * 65)
    print("   EVILOCK - GLOBAL DATABASE PROVISIONING & AUDIT ENGINE")
    print("=" * 65)

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    print(f"\n[1/4] Connecting to target database...")
    # Hide password in logs
    masked_url = database_url
    if "@" in masked_url and "://" in masked_url:
        prefix = masked_url.split("://")[0]
        rest = masked_url.split("://")[1]
        user_pass, host_db = rest.split("@", 1)
        user = user_pass.split(":")[0] if ":" in user_pass else user_pass
        masked_url = f"{prefix}://{user}:*****@{host_db}"
    print(f"      Target: {masked_url}")

    try:
        connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
        engine = create_engine(
            database_url,
            connect_args=connect_args,
            pool_pre_ping=True if not database_url.startswith("sqlite") else False,
            echo=False
        )
        with engine.connect() as conn:
            ver_query = "SELECT sqlite_version();" if database_url.startswith("sqlite") else "SELECT version();"
            result = conn.execute(text(ver_query)).scalar()
            print(f"      [OK] Connection established successfully!")
            print(f"      DB Engine Version: {result[:50]}...")
    except Exception as e:
        print(f"\n[FAIL] Unable to connect to database: {e}")
        sys.exit(1)

    print(f"\n[2/4] Initializing Schema & Cryptographic Ledger...")
    Base.metadata.create_all(bind=engine)
    print("      [OK] Tables created (users, roles, cases, documents, ledger, audit_logs).")

    print(f"\n[3/4] Seeding Roles, Demo Case & Sealed Evidence Blocks...")
    SessionClass = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionClass()
    try:
        init_db(db=db, force_reset_vault=True)
        user_count = db.query(User).count()
        doc_count = db.query(Document).count()
        block_count = db.query(IntegrityLedger).count()
        print(f"      [OK] Verified {user_count} users, {doc_count} documents, {block_count} ledger blocks.")
    finally:
        db.close()

    print(f"\n[4/4] Verifying Mathematical Hash Chain Continuity...")
    db = SessionClass()
    try:
        is_intact, invalid_id, msg = LedgerService.verify_ledger_chain(db)
        if is_intact:
            print(f"      [OK] HASH CHAIN 100% HEALTHY: {msg}")
        else:
            print(f"      [WARNING] Chain alert at Block #{invalid_id}: {msg}")
    finally:
        db.close()

    print("\n" + "=" * 65)
    print("   GLOBAL DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY!")
    print("=" * 65)
    print("\nPre-seeded 1-Click Demo Accounts are ready:")
    print(" - Admin:                  admin            / Admin@1234")
    print(" - Investigating Officer:  io_rajesh        / Officer@1234")
    print(" - Police Officer:         po_vikram        / Police@1234")
    print(" - Prosecutor:             prosecutor_meera / Legal@1234")
    print(" - Judge:                  judge_sharma     / Court@1234")
    print(" - Forensic Expert:        dr_sunita        / Forensic@1234")
    print(" - Auditor:                auditor_verma    / Audit@1234")
    print("=" * 65)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deploy EviLock Global Database")
    parser.add_argument("--url", help="Target PostgreSQL connection URL", default=None)
    args = parser.parse_args()

    target_url = args.url or os.getenv("TARGET_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not target_url:
        print("Usage: python scripts/deploy_db.py --url 'postgresql://user:pass@host:port/dbname'")
        print("Or set the DATABASE_URL environment variable.")
        sys.exit(1)

    deploy_global_database(target_url)
