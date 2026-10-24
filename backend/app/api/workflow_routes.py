from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentPermission
from app.models.workflow import AccessRequest, DocumentReview, Notification
from app.models.base import utc_now
from app.security.rbac import get_current_user
from app.services.audit_service import AuditService
from app.schemas.workflow import (
    AccessRequestCreate, AccessRequestDecision, AccessRequestResponse,
    ReviewSubmitRequest, NotificationResponse
)

router = APIRouter(prefix="/workflow", tags=["Workflows"])

# Access Requests
@router.post("/access-requests", response_model=AccessRequestResponse)
def request_document_access(
    req: AccessRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an access request for a restricted legal document."""
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    access_req = AccessRequest(
        document_id=doc.id,
        requester_id=current_user.id,
        reason=req.reason,
        permission_requested=req.permission_requested,
        status="PENDING"
    )
    db.add(access_req)
    db.commit()
    db.refresh(access_req)

    # Notify document uploader / lead officer
    notify = Notification(
        recipient_id=doc.uploader_id,
        title="New Document Access Request",
        message=f"{current_user.full_name} ({current_user.badge_number or 'Staff'}) requested access to '{doc.title}': {req.reason}",
        category="ACCESS",
        link=f"/access-requests"
    )
    db.add(notify)
    db.commit()

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="DOCUMENT_ACCESS_REQUESTED",
        resource_type="DOCUMENT",
        resource_id=doc.id,
        result="SUCCESS",
        reason=req.reason
    )

    return access_req

@router.get("/access-requests", response_model=List[AccessRequestResponse])
def list_access_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List pending and resolved access requests."""
    return db.query(AccessRequest).order_by(desc(AccessRequest.created_at)).all()

@router.post("/access-requests/{request_id}/decision", response_model=AccessRequestResponse)
def decide_access_request(
    request_id: str,
    decision: AccessRequestDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve or reject a document access request."""
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Access request not found")

    req.status = "APPROVED" if decision.approved else "REJECTED"
    req.approver_id = current_user.id
    req.decision_reason = decision.decision_reason

    if decision.approved:
        expires_at = utc_now() + timedelta(hours=decision.granted_hours)
        req.expires_at = expires_at

        # Grant DocumentPermission
        perm = DocumentPermission(
            document_id=req.document_id,
            user_id=req.requester_id,
            can_view=True,
            can_download=True,
            expires_at=expires_at
        )
        db.add(perm)

    # Notify requester
    notify = Notification(
        recipient_id=req.requester_id,
        title=f"Access Request {'Approved' if decision.approved else 'Rejected'}",
        message=f"Your access request for document #{req.document_id[:8]} was {req.status.lower()} by {current_user.full_name}.",
        category="ACCESS",
        link=f"/documents/{req.document_id}" if decision.approved else None
    )
    db.add(notify)
    db.commit()
    db.refresh(req)

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action=f"ACCESS_REQUEST_{req.status}",
        resource_type="DOCUMENT",
        resource_id=req.document_id,
        result="SUCCESS",
        reason=decision.decision_reason
    )

    return req

# Notifications
@router.get("/notifications", response_model=List[NotificationResponse])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve in-app notifications for authenticated user."""
    return db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(30).all()

@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}
