"""API dependencies - auth, db, pagination."""
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.core.security import decode_access_token

http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(http_bearer)],
) -> User:
    """Get current authenticated user from JWT."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return user


def require_roles(*roles: RoleEnum):
    """Dependency factory for role-based access."""

    def role_checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return user

    return role_checker


# Common role dependencies - use as type only, e.g. user: AdminOrHR
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminOnly = Annotated[User, Depends(require_roles(RoleEnum.ADMIN))]
HROnly = Annotated[User, Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR))]
AdminOrHR = Annotated[User, Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR))]
ManagerOrAbove = Annotated[User, Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR, RoleEnum.MANAGER))]
LeadershipOrAbove = Annotated[User, Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR, RoleEnum.MANAGER, RoleEnum.LEADERSHIP))]

# Callables for use with Depends() when you need to avoid Annotated+default conflict
get_admin_or_hr = require_roles(RoleEnum.ADMIN, RoleEnum.HR)
get_admin_only = require_roles(RoleEnum.ADMIN)
get_manager_or_above = require_roles(RoleEnum.ADMIN, RoleEnum.HR, RoleEnum.MANAGER)
get_leadership_or_above = require_roles(RoleEnum.ADMIN, RoleEnum.HR, RoleEnum.MANAGER, RoleEnum.LEADERSHIP)
