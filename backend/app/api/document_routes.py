import os
import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.models.user import User
from app.models.case import Case
from app.models.document import Document, DocumentVersion, DocumentCategory, DocumentPermission
from app.models.base import utc_now
from app.security.rbac import get_current_user, check_can_view_document
from app.services.storage_service import StorageService
from app.services.ledger_service import LedgerService
from app.services.verification_service import VerificationService
from app.services.audit_service import AuditService
from app.schemas.document import DocumentResponse, DocumentDetailResponse, CategoryResponse, DocumentUpdateMetadataRequest
from app.schemas.ledger import VerifyResponse

router = APIRouter(prefix="/documents", tags=["Documents"])

def _generate_doc_number() -> str:
    return f"DOC-2026-{random.randint(10000, 99999)}"

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """List document categories."""
    return db.query(DocumentCategory).all()

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    case_id: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List accessible documents with filtering and search."""
    query = db.query(Document)

    if case_id:
        query = query.filter(Document.case_id == case_id)
    if category_id:
        query = query.filter(Document.category_id == category_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Document.title.ilike(search_filter),
                Document.document_number.ilike(search_filter),
                Document.reference_number.ilike(search_filter),
                Document.tags.ilike(search_filter)
            )
        )

    all_docs = query.order_by(desc(Document.created_at)).all()

    # Enforce least-privilege view filter
    accessible_docs = [doc for doc in all_docs if check_can_view_document(current_user, doc, db)]

    # Attach latest version for schema
    results = []
    for doc in accessible_docs:
        resp = DocumentResponse.model_validate(doc)
        if doc.versions:
            resp.latest_version = doc.versions[0]
        results.append(resp)

    return results

@router.post("", response_model=DocumentResponse)
def upload_document(
    title: str = Form(...),
    case_id: str = Form(...),
    category_id: str = Form(...),
    confidentiality_level: str = Form("CONFIDENTIAL"),
    description: Optional[str] = Form(None),
    reference_number: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingest a new legal/evidence document:
    1. Validates case and category
    2. Streams file to private storage vault while computing SHA-256
    3. Saves metadata in PostgreSQL
    4. Creates DocumentVersion #1
    5. Appends immutable block to Integrity Ledger
    6. Writes event to Audit Trail
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")

    # Save to private vault and compute SHA-256 hash in real time
    storage_path, sha256_hash, file_size = StorageService.save_upload_stream(file)

    doc_number = _generate_doc_number()
    document = Document(
        document_number=doc_number,
        title=title,
        description=description,
        reference_number=reference_number,
        confidentiality_level=confidentiality_level,
        status="ACTIVE",
        tags=tags,
        case_id=case_id,
        category_id=category_id,
        uploader_id=current_user.id
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Create initial version #1
    version = DocumentVersion(
        document_id=document.id,
        version_number=1,
        file_name=file.filename or "evidence.dat",
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        storage_path=storage_path,
        sha256_hash=sha256_hash,
        change_summary="Initial document ingestion and SHA-256 integrity registration",
        created_by_id=current_user.id
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    # Append block to Integrity Ledger
    ledger_block = LedgerService.append_block(
        db=db,
        document_id=document.id,
        version_id=version.id,
        document_sha256=sha256_hash,
        event_type="INITIAL_UPLOAD",
        actor_id=current_user.id,
        metadata_payload=f"Title: {title} | Case: {case.case_number} | Doc: {doc_number}"
    )

    client_ip = request.client.host if request and request.client else "127.0.0.1"
    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="DOCUMENT_UPLOADED",
        resource_type="DOCUMENT",
        resource_id=document.id,
        result="SUCCESS",
        ip_address=client_ip,
        reason=f"Uploaded version 1 (SHA-256: {sha256_hash[:16]}..., Ledger Block #{ledger_block.id})"
    )

    resp = DocumentResponse.model_validate(document)
    resp.latest_version = version
    return resp

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_details(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full document details with all historical versions and access check."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not check_can_view_document(current_user, doc, db):
        AuditService.log_event(
            db=db,
            actor_id=current_user.id,
            action="DOCUMENT_ACCESS_DENIED",
            resource_type="DOCUMENT",
            resource_id=document_id,
            result="DENIED",
            ip_address=request.client.host if request.client else "127.0.0.1",
            reason="User lacks permissions for this confidential document"
        )
        raise HTTPException(status_code=403, detail="Unauthorized: You do not have permission to view this document")

    resp = DocumentDetailResponse.model_validate(doc)
    if doc.versions:
        resp.latest_version = doc.versions[0]
    return resp

@router.patch("/{document_id}/metadata", response_model=DocumentResponse)
def update_document_metadata(
    document_id: str,
    req: DocumentUpdateMetadataRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update document metadata, confidentiality, or toggle legal hold."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not check_can_view_document(current_user, doc, db):
        raise HTTPException(status_code=403, detail="Access denied")

    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(doc, key, value)

    db.commit()
    db.refresh(doc)

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="DOCUMENT_METADATA_UPDATED",
        resource_type="DOCUMENT",
        resource_id=document_id,
        result="SUCCESS",
        reason="Updated metadata and/or legal hold status"
    )

    resp = DocumentResponse.model_validate(doc)
    if doc.versions:
        resp.latest_version = doc.versions[0]
    return resp

@router.post("/{document_id}/versions", response_model=DocumentResponse)
def create_new_version(
    document_id: str,
    change_summary: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a correction or superseding version. Never silently overwrites!
    Preserves all previous versions, writes new file, computes new SHA-256, and links to ledger.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not check_can_view_document(current_user, doc, db):
        raise HTTPException(status_code=403, detail="Access denied")

    storage_path, sha256_hash, file_size = StorageService.save_upload_stream(file)

    current_max_version = max([v.version_number for v in doc.versions]) if doc.versions else 0
    new_version_num = current_max_version + 1

    new_version = DocumentVersion(
        document_id=doc.id,
        version_number=new_version_num,
        file_name=file.filename or f"evidence_v{new_version_num}.dat",
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        storage_path=storage_path,
        sha256_hash=sha256_hash,
        change_summary=change_summary,
        created_by_id=current_user.id
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    # Append block to Integrity Ledger
    ledger_block = LedgerService.append_block(
        db=db,
        document_id=doc.id,
        version_id=new_version.id,
        document_sha256=sha256_hash,
        event_type="NEW_VERSION",
        actor_id=current_user.id,
        metadata_payload=f"Version: {new_version_num} | Change: {change_summary}"
    )

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="DOCUMENT_VERSION_CREATED",
        resource_type="DOCUMENT",
        resource_id=doc.id,
        result="SUCCESS",
        reason=f"Created version {new_version_num} (SHA-256: {sha256_hash[:16]}..., Ledger Block #{ledger_block.id})"
    )

    resp = DocumentResponse.model_validate(doc)
    resp.latest_version = new_version
    return resp

@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    version_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely stream document bytes from private storage vault."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not check_can_view_document(current_user, doc, db):
        raise HTTPException(status_code=403, detail="Unauthorized to download this document")

    version = None
    if version_id:
        version = db.query(DocumentVersion).filter(DocumentVersion.id == version_id, DocumentVersion.document_id == document_id).first()
    elif doc.versions:
        version = doc.versions[0]

    if not version or not os.path.exists(version.storage_path):
        raise HTTPException(status_code=404, detail="Requested file version not found in vault")

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="DOCUMENT_DOWNLOADED",
        resource_type="DOCUMENT",
        resource_id=document_id,
        result="SUCCESS",
        reason=f"Downloaded version {version.version_number} ({version.file_name})"
    )

    return FileResponse(
        path=version.storage_path,
        filename=version.file_name,
        media_type=version.mime_type
    )

@router.post("/{document_id}/verify", response_model=VerifyResponse)
def verify_document_integrity(
    document_id: str,
    version_id: Optional[str] = None,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    On-demand cryptographic verification:
    Recomputes live SHA-256 from private disk, verifies ledger record, and audits hash-chain continuity.
    Returns VERIFIED or MISMATCH with explicit evidence proof.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    target_version_id = version_id
    if not target_version_id and doc.versions:
        target_version_id = doc.versions[0].id

    if not target_version_id:
        raise HTTPException(status_code=400, detail="Document has no versions to verify")

    client_ip = request.client.host if request and request.client else "127.0.0.1"
    return VerificationService.verify_document_version(
        db=db,
        document_id=document_id,
        version_id=target_version_id,
        actor_id=current_user.id,
        ip_address=client_ip
    )

@router.post("/{document_id}/simulate-tamper")
def simulate_tampering(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    DEVELOPER / JURY DEMO UTILITY:
    Introduces a simulated bit-flip modification directly into the private vault file.
    Next call to verify will immediately fail with status 'MISMATCH'!
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.versions:
        raise HTTPException(status_code=404, detail="Document or version not found")

    latest_version = doc.versions[0]
    tampered = StorageService.tamper_file_bytes(latest_version.storage_path)

    if not tampered:
        raise HTTPException(status_code=500, detail="Could not access storage file to simulate tampering")

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="DEMO_SIMULATE_TAMPER",
        resource_type="DOCUMENT",
        resource_id=document_id,
        result="ALERT",
        reason=f"Injected test bit-flip into storage file '{latest_version.file_name}' to demonstrate tamper detection."
    )

    return {
        "status": "TAMPER_INJECTED",
        "document_id": document_id,
        "version_number": latest_version.version_number,
        "message": "Simulated tampering injected into physical vault storage file. Run 'Verify Integrity' now to view tamper detection alert!"
    }
