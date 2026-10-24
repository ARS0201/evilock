from datetime import datetime
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentVersion
from app.models.ledger import IntegrityLedger
from app.models.base import utc_now
from app.services.storage_service import StorageService
from app.services.ledger_service import LedgerService
from app.services.audit_service import AuditService
from app.schemas.ledger import VerifyResponse

class VerificationService:
    @staticmethod
    def verify_document_version(
        db: Session,
        document_id: str,
        version_id: str,
        actor_id: str,
        ip_address: str = "127.0.0.1"
    ) -> VerifyResponse:
        """
        Executes complete verification of a document version:
        1. Checks physical storage file existence & computes actual SHA-256
        2. Compares physical hash against recorded version hash
        3. Checks ledger entry for recorded hash
        4. Verifies hash-chain continuity
        """
        now = utc_now()

        version = db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()
        if not version:
            return VerifyResponse(
                status="UNVERIFIABLE",
                document_id=document_id,
                version_number=0,
                file_name="Unknown",
                expected_hash="",
                actual_hash="",
                ledger_entry_hash=None,
                is_hash_matching=False,
                is_chain_intact=False,
                tamper_detected=False,
                message="Document version record not found in system.",
                verified_at=now
            )

        # 1. Recompute SHA-256 from raw disk storage
        try:
            actual_file_hash = StorageService.compute_file_hash(version.storage_path)
        except FileNotFoundError:
            AuditService.log_event(
                db=db,
                actor_id=actor_id,
                action="INTEGRITY_CHECK_FAILED",
                resource_type="DOCUMENT",
                resource_id=document_id,
                result="ALERT",
                reason="Physical storage file missing from vault",
                ip_address=ip_address
            )
            return VerifyResponse(
                status="UNVERIFIABLE",
                document_id=document_id,
                version_number=version.version_number,
                file_name=version.file_name,
                expected_hash=version.sha256_hash,
                actual_hash="FILE_MISSING",
                ledger_entry_hash=None,
                is_hash_matching=False,
                is_chain_intact=False,
                tamper_detected=False,
                message="Physical evidence file cannot be found in private storage vault.",
                verified_at=now
            )

        # 2. Check hash match
        is_hash_matching = (actual_file_hash.lower() == version.sha256_hash.lower())

        # 3. Retrieve ledger block
        ledger_entry = db.query(IntegrityLedger).filter(
            IntegrityLedger.document_id == document_id,
            IntegrityLedger.version_id == version_id
        ).order_by(IntegrityLedger.id.desc()).first()

        ledger_hash = ledger_entry.entry_hash if ledger_entry else None

        # 4. Check ledger chain continuity
        is_chain_intact, invalid_id, chain_msg = LedgerService.verify_ledger_chain(db)

        # Determine outcome
        if not is_hash_matching:
            status = "MISMATCH"
            tamper_detected = True
            msg = f"TAMPER ALERT: Live file SHA-256 ({actual_file_hash[:16]}...) DOES NOT MATCH recorded hash ({version.sha256_hash[:16]}...). Document bytes have been altered!"
            audit_result = "ALERT"
        elif not is_chain_intact:
            status = "LEDGER ERROR"
            tamper_detected = False
            msg = f"LEDGER CONSISTENCY ERROR: {chain_msg}"
            audit_result = "ALERT"
        elif ledger_entry is None:
            status = "UNVERIFIABLE"
            tamper_detected = False
            msg = "Missing integrity ledger entry for this version."
            audit_result = "FAILED"
        else:
            status = "VERIFIED"
            tamper_detected = False
            msg = f"INTEGRITY VERIFIED: Document SHA-256 matches cryptographic ledger block #{ledger_entry.id}. Evidence chain is intact."
            audit_result = "SUCCESS"

        # Record event in audit trail
        AuditService.log_event(
            db=db,
            actor_id=actor_id,
            action="DOCUMENT_INTEGRITY_VERIFIED" if status == "VERIFIED" else "DOCUMENT_TAMPER_DETECTED",
            resource_type="DOCUMENT",
            resource_id=document_id,
            result=audit_result,
            reason=msg,
            ip_address=ip_address,
            details_json=f'{{"version": {version.version_number}, "expected_hash": "{version.sha256_hash}", "actual_hash": "{actual_file_hash}", "status": "{status}"}}'
        )

        return VerifyResponse(
            status=status,
            document_id=document_id,
            version_number=version.version_number,
            file_name=version.file_name,
            expected_hash=version.sha256_hash,
            actual_hash=actual_file_hash,
            ledger_entry_hash=ledger_hash,
            is_hash_matching=is_hash_matching,
            is_chain_intact=is_chain_intact,
            tamper_detected=tamper_detected,
            message=msg,
            verified_at=now
        )
