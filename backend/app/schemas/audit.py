from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserResponse

class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    actor_id: Optional[str] = None
    actor: Optional[UserResponse] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    result: str
    ip_address: Optional[str] = None
    reason: Optional[str] = None
    details_json: Optional[str] = None

    class Config:
        from_attributes = True

class StatsSummaryResponse(BaseModel):
    total_documents: int
    active_cases: int
    pending_reviews: int
    pending_access_requests: int
    verified_documents_count: int
    tamper_alerts_count: int
    ledger_blocks_count: int
