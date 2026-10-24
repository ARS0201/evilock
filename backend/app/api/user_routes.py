from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, Role, Department
from app.security.passwords import hash_password
from app.security.rbac import get_current_user, require_roles
from app.services.audit_service import AuditService
from app.schemas.auth import UserResponse, DepartmentResponse, RegisterUserRequest

router = APIRouter(prefix="/users", tags=["Users & Departments"])

@router.get("", response_model=List[UserResponse])
def list_users(
    role_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List system users."""
    users = db.query(User).all()
    if role_name:
        users = [u for u in users if any(r.name == role_name for r in u.roles)]
    return [UserResponse.model_validate(u) for u in users]

@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List law enforcement, judicial, and forensic departments."""
    return db.query(Department).all()

@router.post("", response_model=UserResponse)
def create_user(
    req: RegisterUserRequest,
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    """Administrator-controlled user account creation."""
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    new_user = User(
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        department_id=req.department_id,
        badge_number=req.badge_number,
        designation=req.designation,
        is_active=True
    )

    # Assign roles
    for r_name in req.role_names:
        role = db.query(Role).filter(Role.name == r_name).first()
        if role:
            new_user.roles.append(role)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="USER_CREATED",
        resource_type="USER",
        resource_id=new_user.id,
        result="SUCCESS",
        reason=f"Created user {new_user.username} with roles: {', '.join(req.role_names)}"
    )

    return UserResponse.model_validate(new_user)
