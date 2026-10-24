from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class RoleResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: str
    badge_number: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool
    mfa_enabled: bool
    department: Optional[DepartmentResponse] = None
    roles: List[RoleResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username_or_email: str
    password: str
    mfa_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegisterUserRequest(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_names: List[str]
    department_id: Optional[str] = None
    badge_number: Optional[str] = None
    designation: Optional[str] = None
