from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserResponse

class CategoryResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class VersionResponse(BaseModel):
    id: str
    version_number: int
    file_name: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    change_summary: Optional[str] = None
    is_superseded: bool
    created_at: datetime
    created_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    document_number: str
    title: str
    description: Optional[str] = None
    reference_number: Optional[str] = None
    document_date: datetime
    confidentiality_level: str
    status: str
    is_legal_hold: bool
    legal_hold_reason: Optional[str] = None
    tags: Optional[str] = None
    case_id: str
    category: CategoryResponse
    uploader: UserResponse
    latest_version: Optional[VersionResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    versions: List[VersionResponse] = []

class DocumentUpdateMetadataRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reference_number: Optional[str] = None
    confidentiality_level: Optional[str] = None
    tags: Optional[str] = None
    is_legal_hold: Optional[bool] = None
    legal_hold_reason: Optional[str] = None
