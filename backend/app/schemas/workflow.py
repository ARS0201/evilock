from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserResponse

class AccessRequestCreate(BaseModel):
    document_id: str
    reason: str
    permission_requested: str = "VIEW_AND_DOWNLOAD"

class AccessRequestDecision(BaseModel):
    approved: bool
    decision_reason: Optional[str] = None
    granted_hours: int = 72

class AccessRequestResponse(BaseModel):
    id: str
    document_id: str
    requester: UserResponse
    approver: Optional[UserResponse] = None
    reason: str
    status: str
    decision_reason: Optional[str] = None
    permission_requested: str
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewSubmitRequest(BaseModel):
    status: str  # APPROVED, CHANGES_REQUESTED, REJECTED
    comments: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    link: Optional[str] = None
    category: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
