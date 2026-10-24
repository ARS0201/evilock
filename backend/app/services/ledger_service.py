from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.config import settings
from app.models.ledger import IntegrityLedger
from app.models.base import utc_now

class LedgerService:
    @staticmethod
    def append_block(
        db: Session,
        document_id: str,
        version_id: str,
        document_sha256: str,
        event_type: str,
        actor_id: str,
        metadata_payload: Optional[str] = None
    ) -> IntegrityLedger:
        """
        Appends an immutable block to the integrity ledger.
        Chains with the previous block's entry_hash.
        """
        # Get the latest ledger block
        latest_block = db.query(IntegrityLedger).order_by(desc(IntegrityLedger.id)).first()
        prev_hash = latest_block.entry_hash if latest_block else settings.LEDGER_GENESIS_HASH

        now_dt = utc_now()
        timestamp_canonical = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        entry_hash = IntegrityLedger.calculate_entry_hash(
            prev_hash=prev_hash,
            doc_hash=document_sha256,
            version_id=version_id,
            event_type=event_type,
            actor_id=actor_id,
            timestamp_iso=timestamp_canonical
        )

        entry = IntegrityLedger(
            document_id=document_id,
            version_id=version_id,
            document_sha256=document_sha256,
            previous_entry_hash=prev_hash,
            entry_hash=entry_hash,
            event_type=event_type,
            actor_id=actor_id,
            timestamp_canonical=timestamp_canonical,
            metadata_payload=metadata_payload,
            created_at=now_dt
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def verify_ledger_chain(db: Session) -> Tuple[bool, Optional[int], str]:
        """
        Verifies the cryptographic continuity of the entire hash chain from Block 1 to N.
        Returns: (is_healthy, invalid_block_id_or_none, message)
        """
        blocks = db.query(IntegrityLedger).order_by(IntegrityLedger.id).all()
        if not blocks:
            return True, None, "Ledger is currently empty (Genesis state)."

        expected_prev_hash = settings.LEDGER_GENESIS_HASH

        for block in blocks:
            # 1. Check previous hash linkage
            if block.previous_entry_hash != expected_prev_hash:
                return (
                    False,
                    block.id,
                    f"Chain discontinuity at Block #{block.id}: expected prev_hash '{expected_prev_hash[:16]}...', got '{block.previous_entry_hash[:16]}...'"
                )

            # 2. Check canonical entry hash integrity
            ts_str = block.timestamp_canonical if hasattr(block, 'timestamp_canonical') and block.timestamp_canonical else block.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
            expected_entry_hash = IntegrityLedger.calculate_entry_hash(
                prev_hash=block.previous_entry_hash,
                doc_hash=block.document_sha256,
                version_id=block.version_id,
                event_type=block.event_type,
                actor_id=block.actor_id,
                timestamp_iso=ts_str
            )

            if block.entry_hash != expected_entry_hash:
                return (
                    False,
                    block.id,
                    f"Cryptographic hash invalid at Block #{block.id}: recorded hash differs from canonical recalculation."
                )

            expected_prev_hash = block.entry_hash

        return True, None, f"All {len(blocks)} ledger blocks cryptographically verified and unbroken."
