import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.crud.user import get_user_by_id
from app.db.session import get_db
from app.models.user import User

# HTTPBearer renders Swagger's "Authorize" as a plain token-paste box.
# OAuth2PasswordBearer expects a form-encoded username/password token endpoint,
# which doesn't match our JSON-body /api/auth/login + access/refresh JWT design.
bearer_scheme = HTTPBearer(
    scheme_name="JWT",
    description="Paste the access_token returned by POST /api/auth/login",
    auto_error=True,
)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = creds.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    user = get_user_by_id(db, user_uuid)
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user