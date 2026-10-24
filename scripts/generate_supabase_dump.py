import os
import sys
from datetime import datetime
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.core.database import Base, engine, SessionLocal
import app.models

sql_lines = [
    "-- =================================================================",
    "-- EVILOCK GLOBAL DATABASE: FULL DDL & DEMO SEED SCRIPT FOR SUPABASE",
    "-- Project: EVILOCK (ap-northeast-2)",
    "-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run",
    "-- =================================================================",
    "",
    "DROP SCHEMA IF EXISTS public CASCADE;",
    "CREATE SCHEMA public;",
    "GRANT ALL ON SCHEMA public TO postgres;",
    "GRANT ALL ON SCHEMA public TO public;",
    ""
]

# 1. DDL Statements
for table in Base.metadata.sorted_tables:
    stmt = str(CreateTable(table).compile(dialect=postgresql.dialect())).strip()
    sql_lines.append(stmt + ";")
    sql_lines.append("")

# 2. Data Dump
with engine.connect() as conn:
    for table in Base.metadata.sorted_tables:
        col_names = [c.name for c in table.columns]
        rows = conn.execute(table.select()).fetchall()
        if not rows:
            continue
        sql_lines.append(f"-- Seed {table.name}")
        for r in rows:
            vals = []
            for val in r:
                if val is None:
                    vals.append("NULL")
                elif isinstance(val, bool):
                    vals.append("TRUE" if val else "FALSE")
                elif isinstance(val, (int, float)):
                    vals.append(str(val))
                elif isinstance(val, datetime):
                    vals.append(f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'")
                else:
                    s = str(val).replace("'", "''")
                    vals.append(f"'{s}'")
            cols_str = ", ".join(col_names)
            vals_str = ", ".join(vals)
            sql_lines.append(f"INSERT INTO {table.name} ({cols_str}) VALUES ({vals_str});")
        sql_lines.append("")

out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "supabase_full_setup.sql"))
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Generated complete setup script: {out_path} ({len(sql_lines)} lines)")
