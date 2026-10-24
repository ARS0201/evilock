from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.security.passwords import verify_password
from app.security.tokens import create_access_token
from app.security.rbac import get_current_user
from app.services.audit_service import AuditService
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(
    req: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user with username or email, verify password with Argon2id, and set secure HttpOnly cookie."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    user = db.query(User).filter(
        (User.username == req.username_or_email) | (User.email == req.username_or_email)
    ).first()

    if not user:
        AuditService.log_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            result="DENIED",
            ip_address=client_ip,
            reason=f"Account not found: '{req.username_or_email}'"
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    if not user.is_active or user.is_locked:
        AuditService.log_event(
            db=db,
            actor_id=user.id,
            action="AUTH_LOGIN_BLOCKED",
            result="DENIED",
            ip_address=client_ip,
            reason="Account is disabled or locked"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been disabled or locked")

    if not verify_password(req.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.is_locked = True
        db.commit()

        AuditService.log_event(
            db=db,
            actor_id=user.id,
            action="AUTH_LOGIN_FAILED",
            result="DENIED",
            ip_address=client_ip,
            reason="Incorrect password"
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    # Reset failed attempts on success
    user.failed_login_attempts = 0
    db.commit()

    # Generate token
    token = create_access_token(data={"sub": user.id, "username": user.username})

    # Set secure HttpOnly session cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=not settings.DEBUG
    )

    AuditService.log_event(
        db=db,
        actor_id=user.id,
        action="AUTH_LOGIN_SUCCESS",
        result="SUCCESS",
        ip_address=client_ip,
        reason="Argon2id authentication succeeded"
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clear session cookie and invalidate session."""
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME)
    AuditService.log_event(
        db=db,
        actor_id=current_user.id,
        action="AUTH_LOGOUT",
        result="SUCCESS"
    )
    return {"message": "Successfully logged out of EviLock"}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile and roles."""
    return UserResponse.model_validate(current_user)
