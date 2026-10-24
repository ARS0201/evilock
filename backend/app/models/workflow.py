from sqlalchemy import Column, String, ForeignKey, Text, Boolean, Integer, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now

class AccessRequest(Base, TimestampMixin):
    __tablename__ = "access_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    decision_reason = Column(String(255), nullable=True)
    permission_requested = Column(String(50), default="VIEW_AND_DOWNLOAD", nullable=False)
    expires_at = Column(DateTime, nullable=True)

    document = relationship("Document")
    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approver_id])

class DocumentShare(Base, TimestampMixin):
    __tablename__ = "document_shares"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    recipient_email = Column(String(120), nullable=False)
    recipient_name = Column(String(100), nullable=True)
    access_password_hash = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    max_downloads = Column(Integer, default=5, nullable=False)
    downloads_count = Column(Integer, default=0, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    document = relationship("Document")
    created_by = relationship("User")

class DocumentReview(Base, TimestampMixin):
    __tablename__ = "document_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(String(36), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, CHANGES_REQUESTED, REJECTED
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    document = relationship("Document")
    version = relationship("DocumentVersion")
    reviewer = relationship("User")

class DigitalSignature(Base, TimestampMixin):
    __tablename__ = "digital_signatures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    version_id = Column(String(36), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    signer_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    algorithm = Column(String(50), default="SHA256withRSA", nullable=False)
    signature_data = Column(Text, nullable=False)  # base64 encoded cryptographic signature
    certificate_fingerprint = Column(String(100), nullable=True)
    signer_designation = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    signed_at = Column(DateTime, default=utc_now, nullable=False)

    version = relationship("DocumentVersion")
    signer = relationship("User")

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    category = Column(String(50), default="INFO", nullable=False)  # INFO, ALERT, ACCESS, REVIEW, TAMPER
    is_read = Column(Boolean, default=False, nullable=False)

    recipient = relationship("User")
