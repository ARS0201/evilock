from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.case import Case
from app.models.ledger import IntegrityLedger
from app.models.workflow import AccessRequest, DocumentReview
from app.security.rbac import get_current_user
from app.schemas.audit import AuditLogResponse, StatsSummaryResponse

router = APIRouter(prefix="/audit", tags=["Audit & Stats"])

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    action: Optional[str] = None,
    result: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve immutable audit trail entries."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if result:
        query = query.filter(AuditLog.result == result)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return logs

@router.get("/stats", response_model=StatsSummaryResponse)
def get_dashboard_stats(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculates live system statistics for role-specific dashboard views."""
    total_docs = db.query(Document).count()
    active_cases = db.query(Case).filter(Case.status != "CLOSED", Case.status != "ARCHIVED").count()
    pending_reviews = db.query(DocumentReview).filter(DocumentReview.status == "PENDING").count()
    pending_requests = db.query(AccessRequest).filter(AccessRequest.status == "PENDING").count()
    tamper_alerts = db.query(AuditLog).filter(AuditLog.result == "ALERT").count()
    ledger_blocks = db.query(IntegrityLedger).count()

    # Documents with at least one verification event in audit log
    verified_docs = db.query(AuditLog).filter(
        AuditLog.action == "DOCUMENT_INTEGRITY_VERIFIED",
        AuditLog.result == "SUCCESS"
    ).count()

    return StatsSummaryResponse(
        total_documents=total_docs,
        active_cases=active_cases,
        pending_reviews=pending_reviews,
        pending_access_requests=pending_requests,
        verified_documents_count=verified_docs,
        tamper_alerts_count=tamper_alerts,
        ledger_blocks_count=ledger_blocks
    )
