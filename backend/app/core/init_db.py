import os
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.database import Base, engine, SessionLocal
from app.core.config import settings
from app.models.user import User, Role, Department
from app.models.case import Case, CaseMember
from app.models.document import Document, DocumentVersion, DocumentCategory, RetentionPolicy
from app.models.ledger import IntegrityLedger
from app.models.audit import AuditLog
from app.security.passwords import hash_password

DEMO_DOC_1_BYTES = (
    b"EviLock Certified Evidence File: First Information Report No. 204/2026\n"
    b"Complainant: Apex Financial Services\n"
    b"Accused: Unknown Cyber Syndicate\n"
    b"Jurisdiction: Cyber Crime Division\n"
    b"Date: 2026-10-15\n"
    b"Status: Registered\n"
    b"[OFFICIAL LEGAL RECORD - DEMO]"
)

DEMO_DOC_2_BYTES = (
    b"EviLock Certified Evidence File: Forensic Sciences Laboratory Report #883\n"
    b"Subject: Digital Memory Dump and EnCase Image Analysis\n"
    b"MD5: 9e107d9d372bb6826bd81d3542a419d6\n"
    b"Examiner: Dr. Sunita Rao, Head of Digital Forensics\n"
    b"Conclusion: Clear evidence of unauthorized bit-level script injection.\n"
    b"[OFFICIAL LEGAL RECORD - DEMO]"
)

DEMO_DOC_3_BYTES = (
    b"EviLock Certified Evidence File: Sworn Witness Affidavit under Section 164 CrPC\n"
    b"Deponent: Chief Information Security Officer\n"
    b"Statement: On the night of October 12, unexpected privileged token generation was logged without MFA.\n"
    b"[CONFIDENTIAL LEGAL RECORD - DEMO]"
)

def init_db(db: Session = None, force_reset_vault: bool = False):
    """
    Ensures tables exist and seeds essential reference data + demo dataset if DB is fresh.
    Also ensures physical vault files are present on disk.
    """
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)

    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Check if database is already seeded
        first_role = db.query(Role).first()
        is_fresh = (first_role is None)

        if is_fresh:
            print("[EviLock] Initializing fresh database with essential roles and demo dataset...")

            # 1. Roles
            roles_data = [
                ("ADMIN", "System Administrator", "Full system configuration and governance"),
                ("INVESTIGATING_OFFICER", "Investigating Officer", "Lead cases, evidence ingestion, versions, verification"),
                ("POLICE_OFFICER", "Police Officer", "Upload police reports, FIR submissions, case search"),
                ("PROSECUTOR", "Legal Officer / Prosecutor", "Review dockets, charge sheets, legal filings"),
                ("COURT_USER", "Court-Authorized User", "Court registry, judicial verification, docket access"),
                ("FORENSIC_EXPERT", "Forensic Expert", "Forensic evidence reports, checksum verification"),
                ("AUDITOR", "Authorized Auditor", "Audit log inspection, chain-of-custody verification"),
            ]
            role_map = {}
            for name, display_name, desc in roles_data:
                role = Role(name=name, display_name=display_name, description=desc)
                db.add(role)
                db.flush()
                role_map[name] = role

            # 2. Departments
            depts_data = [
                ("Cyber Crime Investigation Cell", "CCIC", "Specialized cyber forensic and crime cell"),
                ("Criminal Investigation Department", "CID", "State central investigation agency"),
                ("Forensic Science Laboratory", "FSL", "Government certified digital and ballistics forensics"),
                ("District & Sessions Court", "DSC", "Judicial record and trial chamber"),
                ("Directorate of Prosecution", "DOP", "Public prosecution and legal review unit"),
            ]
            dept_map = {}
            for name, code, desc in depts_data:
                dept = Department(name=name, code=code, description=desc)
                db.add(dept)
                db.flush()
                dept_map[code] = dept

            # 3. Categories
            categories_data = [
                ("First Information Report (FIR)", "FIR_POLICE", "Statutory police complaint registered under Section 154 CrPC"),
                ("Forensic Analysis Report", "FORENSIC_REP", "Certified forensic laboratory evaluation, hardware checksums, memory dumps"),
                ("Witness Statement", "WITNESS_STMT", "Deposition and signed statement recorded under Section 161/164 CrPC"),
                ("Court Order & Legal Hold", "COURT_ORDER", "Statutory preservation order issued by presiding magistrate or judicial bench"),
                ("Charge Sheet & Indictment", "CHARGE_SHEET", "Final prosecution report submitted before competent magistrate"),
            ]
            cat_map = {}
            for name, code, desc in categories_data:
                cat = DocumentCategory(name=name, code=code, description=desc)
                db.add(cat)
                db.flush()
                cat_map[code] = cat

            # 4. Retention Policies
            policies_data = [
                ("10-Year Criminal Case Hold", 3650, "Full chain-of-custody archive for 10 years following case disposal"),
                ("Permanent Statutory Archive", 36500, "Permanent court record preservation with continuous tamper audits"),
                ("3-Year Summary Investigation Hold", 1095, "Active retention for minor infractions and summary proceedings"),
            ]
            policy_map = {}
            for name, days, desc in policies_data:
                pol = RetentionPolicy(name=name, retention_period_days=days, description=desc)
                db.add(pol)
                db.flush()
                policy_map[name] = pol

            # 5. Demo Users
            users_data = [
                ("admin", "admin@evilock.gov.in", "Admin@1234", "Vikramaditya", "Rathore", "ADMIN", "CCIC", "EMP-ADM-001"),
                ("io_rajesh", "rajesh.kumar@evilock.gov.in", "Officer@1234", "Rajesh", "Kumar", "INVESTIGATING_OFFICER", "CID", "EMP-IO-102"),
                ("po_vikram", "vikram.singh@evilock.gov.in", "Police@1234", "Vikram", "Singh", "POLICE_OFFICER", "CCIC", "EMP-PO-204"),
                ("prosecutor_meera", "meera.sen@evilock.gov.in", "Legal@1234", "Meera", "Sen", "PROSECUTOR", "DOP", "EMP-PRO-301"),
                ("judge_sharma", "kp.sharma@evilock.gov.in", "Court@1234", "K. P.", "Sharma", "COURT_USER", "DSC", "EMP-CRT-405"),
                ("dr_sunita", "sunita.rao@evilock.gov.in", "Forensic@1234", "Dr. Sunita", "Rao", "FORENSIC_EXPERT", "FSL", "EMP-FSL-509"),
                ("auditor_verma", "anand.verma@evilock.gov.in", "Audit@1234", "Anand", "Verma", "AUDITOR", "DSC", "EMP-AUD-601"),
            ]
            user_map = {}
            for u_name, email, pwd, first, last, r_code, d_code, badge in users_data:
                usr = User(
                    username=u_name,
                    email=email,
                    hashed_password=hash_password(pwd),
                    first_name=first,
                    last_name=last,
                    badge_number=badge,
                    role_id=role_map[r_code].id,
                    department_id=dept_map[d_code].id,
                    is_active=True
                )
                db.add(usr)
                db.flush()
                user_map[u_name] = usr

            # 6. Demo Case
            case = Case(
                case_number="CR-2026-0491",
                title="State of NCT vs. Syndicate Cyberspace Infiltrators",
                description="High-profile corporate fund siphoning, unauthorized API gateway exfiltration, and banking token manipulation.",
                jurisdiction="Special Cyber Court, New Delhi",
                court_name="Court of Additional Sessions Judge #4",
                presiding_judge="Hon. Justice K. P. Sharma",
                status="UNDER_INVESTIGATION",
                incident_date=datetime(2026, 10, 12, 14, 30, tzinfo=timezone.utc),
                lead_investigator_id=user_map["io_rajesh"].id,
                created_by_id=user_map["admin"].id
            )
            db.add(case)
            db.flush()

            # Add case members
            for u in [user_map["io_rajesh"], user_map["po_vikram"], user_map["prosecutor_meera"], user_map["dr_sunita"]]:
                member = CaseMember(
                    case_id=case.id,
                    user_id=u.id,
                    assigned_role="COLLABORATOR",
                    notes="Assigned to multi-agency joint investigation team"
                )
                db.add(member)

            # 7. Demo Documents
            demo_docs = [
                (
                    "DOC-2026-10491",
                    "FIR No. 204/2026 - Initial Complaint & Station Diary",
                    "Initial First Information Report registered under Sections 420, 468, and 66C IT Act.",
                    "FIR_POLICE",
                    "FIR-CC-204",
                    "FIR_204_2026_Certified.pdf",
                    DEMO_DOC_1_BYTES,
                    user_map["po_vikram"],
                    True
                ),
                (
                    "DOC-2026-10492",
                    "FSL Digital Memory Dump & Forensic Analysis",
                    "Forensic memory snapshot and hash integrity report of seized server hard drives.",
                    "FORENSIC_REP",
                    "FSL-REP-883",
                    "Forensic_Memory_Analysis_FSL883.pdf",
                    DEMO_DOC_2_BYTES,
                    user_map["dr_sunita"],
                    True
                ),
                (
                    "DOC-2026-10493",
                    "Witness Statement - Chief Security Architect",
                    "Deposition and signed affidavit describing unauthorized privileged credential escalation.",
                    "WITNESS_STMT",
                    "WIT-AFF-012",
                    "Witness_Affidavit_Chief_Architect.pdf",
                    DEMO_DOC_3_BYTES,
                    user_map["io_rajesh"],
                    False
                )
            ]

            prev_hash = settings.LEDGER_GENESIS_HASH

            for doc_num, title, desc, cat_code, ref_num, filename, raw_bytes, uploader, is_legal_hold in demo_docs:
                sha256_hash = hashlib.sha256(raw_bytes).hexdigest()
                storage_path = os.path.join(settings.STORAGE_LOCAL_PATH, f"{doc_num}.dat")
                with open(storage_path, "wb") as f:
                    f.write(raw_bytes)

                doc = Document(
                    document_number=doc_num,
                    title=title,
                    description=desc,
                    reference_number=ref_num,
                    confidentiality_level="CONFIDENTIAL",
                    status="ACTIVE",
                    is_legal_hold=is_legal_hold,
                    legal_hold_reason="Court-mandated preservation order under Section 91 CrPC" if is_legal_hold else None,
                    tags="Cyber, Evidence, Tamper-Resistant, Court-Certified",
                    case_id=case.id,
                    category_id=cat_map[cat_code].id,
                    retention_policy_id=policy_map["10-Year Criminal Case Hold"].id,
                    uploader_id=uploader.id
                )
                db.add(doc)
                db.flush()

                ver = DocumentVersion(
                    document_id=doc.id,
                    version_number=1,
                    file_name=filename,
                    file_size_bytes=len(raw_bytes),
                    mime_type="application/pdf",
                    storage_path=storage_path,
                    sha256_hash=sha256_hash,
                    change_summary="Original ingested evidence record registered into cryptographic vault",
                    created_by_id=uploader.id
                )
                db.add(ver)
                db.flush()

                now_dt = datetime.now(timezone.utc)
                timestamp_canonical = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                entry_hash = IntegrityLedger.calculate_entry_hash(
                    prev_hash=prev_hash,
                    doc_hash=sha256_hash,
                    version_id=ver.id,
                    event_type="INITIAL_UPLOAD",
                    actor_id=uploader.id,
                    timestamp_iso=timestamp_canonical
                )

                block = IntegrityLedger(
                    document_id=doc.id,
                    version_id=ver.id,
                    event_type="INITIAL_UPLOAD",
                    actor_id=uploader.id,
                    action_summary=f"Ingested and sealed version 1 of '{filename}' into evidence vault",
                    doc_sha256=sha256_hash,
                    prev_hash=prev_hash,
                    entry_hash=entry_hash,
                    timestamp=now_dt
                )
                db.add(block)
                db.flush()
                prev_hash = entry_hash

            db.commit()
            print("[EviLock] Initial demo seed completed successfully!")
        else:
            # Ensure physical storage vault files exist on disk if missing or if forced
            vault_files = [
                ("DOC-2026-10491.dat", DEMO_DOC_1_BYTES),
                ("DOC-2026-10492.dat", DEMO_DOC_2_BYTES),
                ("DOC-2026-10493.dat", DEMO_DOC_3_BYTES),
            ]
            for fname, content in vault_files:
                fpath = os.path.join(settings.STORAGE_LOCAL_PATH, fname)
                if force_reset_vault or not os.path.exists(fpath):
                    with open(fpath, "wb") as f:
                        f.write(content)

    finally:
        if close_session:
            db.close()
