from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.base import utc_now

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        actor_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        result: str = "SUCCESS",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        reason: Optional[str] = None,
        details_json: Optional[str] = None
    ) -> AuditLog:
        """Create an immutable audit log entry."""
        log = AuditLog(
            timestamp=utc_now(),
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            result=result,
            ip_address=ip_address,
            user_agent=user_agent,
            reason=reason,
            details_json=details_json
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
