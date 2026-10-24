from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now

class Case(Base, TimestampMixin):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    case_type = Column(String(50), nullable=False)  # Criminal, Cybercrime, Financial, Forensic, Judicial
    description = Column(Text, nullable=True)
    status = Column(String(50), default="OPEN", nullable=False, index=True) 
    # OPEN, UNDER_INVESTIGATION, UNDER_LEGAL_REVIEW, SUBMITTED_TO_COURT, CLOSED, ARCHIVED
    confidentiality_level = Column(String(50), default="CONFIDENTIAL", nullable=False) 
    # PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET

    opening_date = Column(DateTime, default=utc_now, nullable=False)
    closing_date = Column(DateTime, nullable=True)

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    assigned_officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    department = relationship("Department", back_populates="cases")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    members = relationship("CaseMember", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")

class CaseMember(Base, TimestampMixin):
    __tablename__ = "case_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_in_case = Column(String(50), default="INVESTIGATOR", nullable=False)
    # LEAD_INVESTIGATOR, INVESTIGATOR, PROSECUTOR, FORENSIC_ANALYST, AUDITOR

    case = relationship("Case", back_populates="members")
    user = relationship("User", back_populates="case_memberships")
