from typing import List, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentPermission
from app.security.tokens import decode_access_token

security = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts user session either from HttpOnly cookie or Authorization Bearer header.
    """
    token = None
    # 1. Check HttpOnly cookie
    if settings.SESSION_COOKIE_NAME in request.cookies:
        token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    
    # 2. Check Bearer Authorization header
    if not token and auth:
        token = auth.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or disabled")

    return user

def require_roles(*allowed_roles: str):
    """Dependency that enforces role-based access control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [role.name for role in current_user.roles]
        
        # Check if user has any of the permitted roles
        has_permission = any(role_name in allowed_roles for role_name in user_role_names)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def check_can_view_document(user: User, document: Document, db: Session) -> bool:
    """Verifies document-level view authorization according to least-privilege principle."""
    user_roles = [r.name for r in user.roles]
    
    # System Auditor has explicit inspection rights for audit/integrity
    if "AUDITOR" in user_roles:
        return True
    
    # Uploader always has view access
    if document.uploader_id == user.id:
        return True

    # Assigned case officer has view access
    if document.case and document.case.assigned_officer_id == user.id:
        return True

    # Explicit document permissions
    perm = db.query(DocumentPermission).filter(
        DocumentPermission.document_id == document.id,
        DocumentPermission.user_id == user.id,
        DocumentPermission.can_view == True
    ).first()
    if perm:
        return True

    # Department level permission
    if user.department_id:
        dept_perm = db.query(DocumentPermission).filter(
            DocumentPermission.document_id == document.id,
            DocumentPermission.department_id == user.department_id,
            DocumentPermission.can_view == True
        ).first()
        if dept_perm:
            return True

    return False
