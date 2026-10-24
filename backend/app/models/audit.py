from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    # AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILED, DOCUMENT_UPLOADED, DOCUMENT_ACCESSED, 
    # DOCUMENT_DOWNLOADED, INTEGRITY_VERIFIED, INTEGRITY_TAMPER_ALERT, ACCESS_REQUESTED,
    # ACCESS_GRANTED, REVIEW_SUBMITTED, LEGAL_HOLD_APPLIED, ADMIN_CONFIG_CHANGED
    resource_type = Column(String(50), nullable=True)  # DOCUMENT, CASE, USER, LEDGER, SYSTEM
    resource_id = Column(String(100), nullable=True)
    result = Column(String(30), default="SUCCESS", nullable=False)  # SUCCESS, FAILED, DENIED, ALERT
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    reason = Column(String(255), nullable=True)
    details_json = Column(Text, nullable=True)

    actor = relationship("User")
