from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.case import Case, CaseMember
from app.models.document import Document
from app.security.rbac import get_current_user
from app.services.audit_service import AuditService
from app.schemas.case import CaseResponse, CaseCreateRequest, CaseUpdateRequest
from app.schemas.document import DocumentResponse

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=List[CaseResponse])
def list_cases(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List investigation cases."""
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status)

    cases = query.order_by(desc(Case.created_at)).all()
    results = []
    for c in cases:
        resp = CaseResponse.model_validate(c)
        resp.documents_count = len(c.documents)
        results.append(resp)
    return results

@router.post("", response_model=CaseResponse)
def create_case(
    req: CaseCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new investigation case dossier."""
    existing = db.query(Case).filter(Case.case_number == req.case_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Case number '{req.case_number}' already exists")

    new_case = Case(
        case_number=req.case_number,
        title=req.title,
        case_type=req.case_type,
        description=req.description,
        department_id=req.department_id,
        assigned_officer_id=current_user.id,
        confidentiality_level=req.confidentiality_level,
        status="OPEN"
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Add assigned officer as lead investigator
    lead_member = CaseMember(
        case_id=new_case.id,
        user_id=current_user.id,
        role_in_case="LEAD_INVESTIGATOR"
    )
    db.add(lead_member)

    # Add collaborators
    for user_id in req.collaborator_ids:
        if user_id != current_user.id:
            member = CaseMember(case_id=new_case.id, user_id=user_id, role_in_case="INVESTIGATOR")
            db.add(member)

    db.commit()

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="CASE_CREATED",
        resource_type="CASE",
        resource_id=new_case.id,
        result="SUCCESS",
        reason=f"Created case dossier {new_case.case_number}: '{new_case.title}'"
    )

    resp = CaseResponse.model_validate(new_case)
    resp.documents_count = 0
    return resp

@router.get("/{case_id}")
def get_case_details(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full case details, including assigned team and associated documents."""
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    docs = []
    for doc in c.documents:
        d_resp = DocumentResponse.model_validate(doc)
        if doc.versions:
            d_resp.latest_version = doc.versions[0]
        docs.append(d_resp)

    c_resp = CaseResponse.model_validate(c)
    c_resp.documents_count = len(docs)

    return {
        "case": c_resp,
        "members": [
            {
                "id": m.id,
                "user_id": m.user_id,
                "full_name": m.user.full_name,
                "badge_number": m.user.badge_number,
                "role_in_case": m.role_in_case,
                "email": m.user.email
            }
            for m in c.members
        ],
        "documents": docs
    }

@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    req: CaseUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update case status or information."""
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(c, key, val)

    db.commit()
    db.refresh(c)

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="CASE_UPDATED",
        resource_type="CASE",
        resource_id=case_id,
        result="SUCCESS",
        reason=f"Updated case status/metadata to {c.status}"
    )

    resp = CaseResponse.model_validate(c)
    resp.documents_count = len(c.documents)
    return resp
