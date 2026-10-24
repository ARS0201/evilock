from sqlalchemy import Column, String, ForeignKey, Text, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now

class DocumentCategory(Base, TimestampMixin):
    __tablename__ = "document_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    documents = relationship("Document", back_populates="category")

class RetentionPolicy(Base, TimestampMixin):
    __tablename__ = "retention_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    retention_years = Column(Integer, default=10, nullable=False)
    description = Column(String(255), nullable=True)
    disposal_action = Column(String(50), default="ARCHIVE", nullable=False)  # ARCHIVE, PERMANENT_RETAIN, REVIEW

    documents = relationship("Document", back_populates="retention_policy")

class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True, index=True)
    document_date = Column(DateTime, default=utc_now, nullable=False)

    confidentiality_level = Column(String(50), default="CONFIDENTIAL", nullable=False)
    # PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET

    status = Column(String(50), default="ACTIVE", nullable=False)
    # ACTIVE, SUBMITTED_FOR_REVIEW, APPROVED, REJECTED, ARCHIVED

    is_legal_hold = Column(Boolean, default=False, nullable=False)
    legal_hold_reason = Column(String(255), nullable=True)

    tags = Column(String(255), nullable=True)  # comma separated tags

    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("document_categories.id"), nullable=False)
    retention_policy_id = Column(String(36), ForeignKey("retention_policies.id"), nullable=True)
    uploader_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    case = relationship("Case", back_populates="documents")
    category = relationship("DocumentCategory", back_populates="documents")
    retention_policy = relationship("RetentionPolicy", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploader_id])
    
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan", order_by="desc(DocumentVersion.version_number)")
    permissions = relationship("DocumentPermission", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base, TimestampMixin):
    __tablename__ = "document_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    storage_path = Column(String(500), nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)  # 64-char hex SHA-256
    change_summary = Column(Text, nullable=True)
    is_superseded = Column(Boolean, default=False, nullable=False)

    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    document = relationship("Document", back_populates="versions")
    created_by = relationship("User", foreign_keys=[created_by_id])

class DocumentPermission(Base, TimestampMixin):
    __tablename__ = "document_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=True)

    can_view = Column(Boolean, default=True, nullable=False)
    can_download = Column(Boolean, default=False, nullable=False)
    can_edit_metadata = Column(Boolean, default=False, nullable=False)
    can_create_version = Column(Boolean, default=False, nullable=False)
    can_share = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="permissions")
    user = relationship("User", foreign_keys=[user_id])
    department = relationship("Department", foreign_keys=[department_id])
