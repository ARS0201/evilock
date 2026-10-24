import hashlib
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now

class IntegrityLedger(Base, TimestampMixin):
    __tablename__ = "integrity_ledger"

    # Sequential block height
    id = Column(Integer, primary_key=True, autoincrement=True)
    entry_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id = Column(String(36), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    
    document_sha256 = Column(String(64), nullable=False)
    previous_entry_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), unique=True, nullable=False, index=True)
    
    event_type = Column(String(50), nullable=False)  # INITIAL_UPLOAD, NEW_VERSION, LEGAL_SUBMISSION, RETENTION_HOLD
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    timestamp_canonical = Column(String(50), nullable=False, default=lambda: utc_now().strftime("%Y-%m-%dT%H:%M:%SZ"))
    metadata_payload = Column(Text, nullable=True)

    document = relationship("Document")
    version = relationship("DocumentVersion")
    actor = relationship("User")

    @staticmethod
    def calculate_entry_hash(prev_hash: str, doc_hash: str, version_id: str, event_type: str, actor_id: str, timestamp_iso: str) -> str:
        """
        Calculates canonical SHA-256 hash chaining entry:
        H_n = SHA256(prev_hash || doc_hash || version_id || event_type || actor_id || timestamp)
        """
        payload = f"{prev_hash}|{doc_hash}|{version_id}|{event_type}|{actor_id}|{timestamp_iso}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()
