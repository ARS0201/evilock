from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.database import get_db
from app.models.ledger import IntegrityLedger
from app.security.rbac import get_current_user
from app.services.ledger_service import LedgerService
from app.schemas.ledger import LedgerEntryResponse, ChainAuditSummary

router = APIRouter(prefix="/ledger", tags=["Integrity Ledger"])

@router.get("", response_model=List[LedgerEntryResponse])
def get_ledger_blocks(
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve sequential blocks from the append-only integrity ledger."""
    blocks = db.query(IntegrityLedger).order_by(desc(IntegrityLedger.id)).limit(limit).all()
    return blocks

@router.get("/audit-chain", response_model=ChainAuditSummary)
def audit_hash_chain(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Performs full mathematical audit of the SHA-256 hash chain from Block 1 to current height.
    Verifies that no historic block was altered or replaced.
    """
    is_healthy, invalid_block_id, msg = LedgerService.verify_ledger_chain(db)
    total_blocks = db.query(IntegrityLedger).count()
    latest_block = db.query(IntegrityLedger).order_by(desc(IntegrityLedger.id)).first()

    return ChainAuditSummary(
        total_blocks=total_blocks,
        is_chain_healthy=is_healthy,
        genesis_hash=settings.LEDGER_GENESIS_HASH,
        latest_block_hash=latest_block.entry_hash if latest_block else settings.LEDGER_GENESIS_HASH,
        invalid_block_id=invalid_block_id,
        message=msg
    )
