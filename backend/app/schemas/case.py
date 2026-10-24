from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserResponse, DepartmentResponse

class CaseMemberResponse(BaseModel):
    id: str
    user: UserResponse
    role_in_case: str
    created_at: datetime

    class Config:
        from_attributes = True

class CaseResponse(BaseModel):
    id: str
    case_number: str
    title: str
    case_type: str
    description: Optional[str] = None
    status: str
    confidentiality_level: str
    opening_date: datetime
    closing_date: Optional[datetime] = None
    department: DepartmentResponse
    assigned_officer: UserResponse
    created_at: datetime
    documents_count: int = 0

    class Config:
        from_attributes = True

class CaseCreateRequest(BaseModel):
    case_number: str
    title: str
    case_type: str
    description: Optional[str] = None
    department_id: str
    confidentiality_level: str = "CONFIDENTIAL"
    collaborator_ids: List[str] = []

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    confidentiality_level: Optional[str] = None
