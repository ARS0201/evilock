from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserResponse

class LedgerEntryResponse(BaseModel):
    id: int
    entry_id: str
    document_id: str
    version_id: str
    document_sha256: str
    previous_entry_hash: str
    entry_hash: str
    event_type: str
    actor_id: str
    actor: Optional[UserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VerifyResponse(BaseModel):
    status: str  # VERIFIED, MISMATCH, LEDGER ERROR, UNVERIFIABLE
    document_id: str
    version_number: int
    file_name: str
    expected_hash: str
    actual_hash: str
    ledger_entry_hash: Optional[str] = None
    is_hash_matching: bool
    is_chain_intact: bool
    tamper_detected: bool
    message: str
    verified_at: datetime

class ChainAuditSummary(BaseModel):
    total_blocks: int
    is_chain_healthy: bool
    genesis_hash: str
    latest_block_hash: str
    invalid_block_id: Optional[int] = None
    message: str
