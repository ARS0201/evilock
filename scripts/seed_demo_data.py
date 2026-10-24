import os
import sys
import hashlib
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.core.database import Base, engine, SessionLocal
from app.core.config import settings
from app.models.user import User, Role, Department
from app.models.case import Case, CaseMember
from app.models.document import Document, DocumentVersion, DocumentCategory, RetentionPolicy, DocumentPermission
from app.models.ledger import IntegrityLedger
from app.models.audit import AuditLog
from app.models.workflow import AccessRequest, DocumentReview, Notification
from app.security.passwords import hash_password

def seed_database():
    print("[EviLock] Initializing EviLock Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Ensure storage vault exists
    os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)

    print("[EviLock] Seeding Roles...")
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
        role = db.query(Role).filter(Role.name == name).first()
        if not role:
            role = Role(name=name, display_name=display_name, description=desc)
            db.add(role)
            db.commit()
            db.refresh(role)
        role_map[name] = role

    print("[EviLock] Seeding Departments...")
    depts_data = [
        ("Cyber Crime Investigation Cell", "CCIC", "Specialized cyber forensic and crime cell"),
        ("Criminal Investigation Department", "CID", "State central investigation agency"),
        ("Forensic Science Laboratory", "FSL", "Government certified digital and ballistics forensics"),
        ("District & Sessions Court", "DSC", "Judicial record and trial chamber"),
        ("Directorate of Prosecution", "DOP", "Public prosecution and legal review unit"),
    ]
    dept_map = {}
    for name, code, desc in depts_data:
        dept = db.query(Department).filter(Department.code == code).first()
        if not dept:
            dept = Department(name=name, code=code, description=desc)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        dept_map[code] = dept

    print("[EviLock] Seeding Document Categories...")
    cats_data = [
        ("FIR and Police Reports", "FIR_POLICE", "First Information Reports and station diaries"),
        ("Investigation Records", "INVESTIGATION", "Case diaries, search and seizure memos"),
        ("Witness Statements", "WITNESS_STMT", "Recorded statements under Section 161/164 CrPC"),
        ("Charge Sheets", "CHARGE_SHEET", "Final formal police investigative reports"),
        ("Court Filings", "COURT_FILING", "Bail petitions, charge orders, legal appeals"),
        ("Evidence Records", "EVIDENCE_REC", "Chain-of-custody memos and physical item records"),
        ("Forensic Reports", "FORENSIC_REP", "Certified forensic digital and laboratory reports"),
        ("Legal Notices", "LEGAL_NOTICE", "Summons, production notices, warrant orders"),
        ("Court Judgments", "COURT_JUDG", "Judicial orders, interim rulings, final verdicts"),
        ("Other Authorized Documents", "OTHER_AUTH", "Authorized legal and procedural records"),
    ]
    cat_map = {}
    for name, code, desc in cats_data:
        cat = db.query(DocumentCategory).filter(DocumentCategory.code == code).first()
        if not cat:
            cat = DocumentCategory(name=name, code=code, description=desc)
            db.add(cat)
            db.commit()
            db.refresh(cat)
        cat_map[code] = cat

    print("[EviLock] Seeding Retention Policies...")
    policies_data = [
        ("Permanent Legal Retention", 99, "Permanent retention for heinous crime and evidence records", "PERMANENT_RETAIN"),
        ("10-Year Criminal Case Hold", 10, "Standard 10-year holding period from trial completion", "ARCHIVE"),
        ("5-Year Summary Retention", 5, "Minor procedural notices and summary proceedings", "REVIEW"),
    ]
    policy_map = {}
    for name, yrs, desc, action in policies_data:
        pol = db.query(RetentionPolicy).filter(RetentionPolicy.name == name).first()
        if not pol:
            pol = RetentionPolicy(name=name, retention_years=yrs, description=desc, disposal_action=action)
            db.add(pol)
            db.commit()
            db.refresh(pol)
        policy_map[name] = pol

    print("[EviLock] Seeding 7 Role Demo Users...")
    users_data = [
        ("admin", "admin@evilock.gov.in", "Admin@1234", "Vikramaditya Rathore (DEMO)", "ADMIN", "CCIC", "ADM-001", "Director of IT & Security"),
        ("io_rajesh", "rajesh.kumar@cid.gov.in", "Officer@1234", "Insp. Rajesh Kumar (DEMO)", "INVESTIGATING_OFFICER", "CID", "CID-7892", "Senior Investigating Officer"),
        ("po_vikram", "vikram.singh@police.gov.in", "Police@1234", "Sub-Insp. Vikram Singh (DEMO)", "POLICE_OFFICER", "CCIC", "POL-4051", "Station Sub-Inspector"),
        ("prosecutor_meera", "meera.sen@prosecution.gov.in", "Legal@1234", "Adv. Meera Sen (DEMO)", "PROSECUTOR", "DOP", "BAR-6124", "Public Prosecutor"),
        ("judge_sharma", "k.sharma@judiciary.gov.in", "Court@1234", "Hon. Justice K. P. Sharma (DEMO)", "COURT_USER", "DSC", "JUD-1092", "Additional District Judge"),
        ("dr_sunita", "sunita.rao@fsl.gov.in", "Forensic@1234", "Dr. Sunita Rao (DEMO)", "FORENSIC_EXPERT", "FSL", "FSL-3381", "Head of Digital Forensics Division"),
        ("auditor_verma", "anand.verma@cag.gov.in", "Audit@1234", "Anand Verma (DEMO)", "AUDITOR", "DSC", "AUD-9910", "Principal Security Auditor"),
    ]
    user_map = {}
    for username, email, pwd, full_name, role_name, dept_code, badge, designation in users_data:
        u = db.query(User).filter(User.username == username).first()
        if not u:
            u = User(
                username=username,
                email=email,
                full_name=full_name,
                hashed_password=hash_password(pwd),
                department_id=dept_map[dept_code].id,
                badge_number=badge,
                designation=designation,
                is_active=True
            )
            u.roles.append(role_map[role_name])
            db.add(u)
            db.commit()
            db.refresh(u)
        user_map[username] = u

    print("[EviLock] Seeding Demo Investigation Case...")
    case = db.query(Case).filter(Case.case_number == "CR-2026-0491").first()
    if not case:
        case = Case(
            case_number="CR-2026-0491",
            title="State vs. Cyber Heist Syndicate & Data Exfiltration",
            case_type="Cybercrime & Evidence Tampering",
            description="DEMO CASE: Investigation into unauthorized electronic penetration, digital document tampering, and evidence chain manipulation at Apex Financial Systems.",
            status="UNDER_INVESTIGATION",
            confidentiality_level="CONFIDENTIAL",
            department_id=dept_map["CID"].id,
            assigned_officer_id=user_map["io_rajesh"].id
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        # Add team members
        for u_name, role_in_case in [
            ("io_rajesh", "LEAD_INVESTIGATOR"),
            ("po_vikram", "INVESTIGATOR"),
            ("dr_sunita", "FORENSIC_ANALYST"),
            ("prosecutor_meera", "PROSECUTOR")
        ]:
            db.add(CaseMember(case_id=case.id, user_id=user_map[u_name].id, role_in_case=role_in_case))
        db.commit()

    print("[EviLock] Seeding Demo Documents & Ledger Blocks...")
    demo_docs = [
        (
            "DOC-2026-10491",
            "FIR No. 204/2026 - Initial Complaint & Station Diary",
            "Initial First Information Report registered under Sections 420, 468, and 66C IT Act.",
            "FIR_POLICE",
            "FIR-CC-204",
            "FIR_204_2026_Certified.pdf",
            b"EviLock Certified Evidence File: First Information Report No. 204/2026\nComplainant: Apex Financial Services\nAccused: Unknown Cyber Syndicate\nJurisdiction: Cyber Crime Division\nDate: 2026-10-15\nStatus: Registered\n[OFFICIAL LEGAL RECORD - DEMO]",
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
            b"EviLock Certified Evidence File: Forensic Sciences Laboratory Report #883\nSubject: Digital Memory Dump and EnCase Image Analysis\nMD5: 9e107d9d372bb6826bd81d3542a419d6\nExaminer: Dr. Sunita Rao, Head of Digital Forensics\nConclusion: Clear evidence of unauthorized bit-level script injection.\n[OFFICIAL LEGAL RECORD - DEMO]",
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
            b"EviLock Certified Evidence File: Sworn Witness Affidavit under Section 164 CrPC\nDeponent: Chief Information Security Officer\nStatement: On the night of October 12, unexpected privileged token generation was logged without MFA.\n[CONFIDENTIAL LEGAL RECORD - DEMO]",
            user_map["io_rajesh"],
            False
        )
    ]

    prev_hash = settings.LEDGER_GENESIS_HASH

    for doc_num, title, desc, cat_code, ref_num, filename, raw_bytes, uploader, is_legal_hold in demo_docs:
        doc = db.query(Document).filter(Document.document_number == doc_num).first()
        if not doc:
            # 1. Compute real SHA-256 of file bytes
            sha256_hash = hashlib.sha256(raw_bytes).hexdigest()

            # 2. Save physical file to private vault
            storage_path = os.path.join(settings.STORAGE_LOCAL_PATH, f"{doc_num}.dat")
            with open(storage_path, "wb") as f:
                f.write(raw_bytes)

            # 3. Create Document record
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
            db.commit()
            db.refresh(doc)

            # 4. Create DocumentVersion #1
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
            db.commit()
            db.refresh(ver)

            # 5. Append chained block to Integrity Ledger
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
                document_sha256=sha256_hash,
                previous_entry_hash=prev_hash,
                entry_hash=entry_hash,
                event_type="INITIAL_UPLOAD",
                actor_id=uploader.id,
                timestamp_canonical=timestamp_canonical,
                metadata_payload=f"Title: {title} | Ref: {ref_num}",
                created_at=now_dt
            )
            db.add(block)
            db.commit()
            db.refresh(block)

            prev_hash = entry_hash

            # 6. Add Audit Log
            audit = AuditLog(
                actor_id=uploader.id,
                action="DOCUMENT_UPLOADED",
                resource_type="DOCUMENT",
                resource_id=doc.id,
                result="SUCCESS",
                reason=f"Ingested {filename} (SHA-256: {sha256_hash[:16]}..., Ledger Block #{block.id})"
            )
            db.add(audit)
            db.commit()

    # Restore physical vault files for demo documents
    vault_files = [
        ("DOC-2026-10491.dat", b"EviLock Certified Evidence File: First Information Report No. 204/2026\nComplainant: Apex Financial Services\nAccused: Unknown Cyber Syndicate\nJurisdiction: Cyber Crime Division\nDate: 2026-10-15\nStatus: Registered\n[OFFICIAL LEGAL RECORD - DEMO]"),
        ("DOC-2026-10492.dat", b"EviLock Certified Evidence File: Forensic Sciences Laboratory Report #883\nSubject: Digital Memory Dump and EnCase Image Analysis\nMD5: 9e107d9d372bb6826bd81d3542a419d6\nExaminer: Dr. Sunita Rao, Head of Digital Forensics\nConclusion: Clear evidence of unauthorized bit-level script injection.\n[OFFICIAL LEGAL RECORD - DEMO]"),
        ("DOC-2026-10493.dat", b"EviLock Certified Evidence File: Sworn Witness Affidavit under Section 164 CrPC\nDeponent: Chief Information Security Officer\nStatement: On the night of October 12, unexpected privileged token generation was logged without MFA.\n[CONFIDENTIAL LEGAL RECORD - DEMO]")
    ]
    for fname, raw_bytes in vault_files:
        fpath = os.path.join(settings.STORAGE_LOCAL_PATH, fname)
        with open(fpath, "wb") as f:
            f.write(raw_bytes)

    print("[OK] EviLock Demo Seed Complete!")
    print("\n-----------------------------------------------------------")
    print(">>> DEMO LOGIN CREDENTIALS (ALL ROLES READY):")
    print("-----------------------------------------------------------")
    for username, email, pwd, full_name, role_name, dept_code, badge, designation in users_data:
        print(f"Role: {role_name:<22} | User: {username:<18} | Pass: {pwd:<14} | Name: {full_name}")
    print("-----------------------------------------------------------\n")

    db.close()

if __name__ == "__main__":
    seed_database()
