from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from urllib.parse import quote
import smtplib

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    hash_password_reset_token,
)
from app.crud.user import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_password_reset_token,
    reset_password,
    set_password_reset_token,
)
from app.core.config import settings
from app.core.email import send_password_reset_email
from app.db.session import get_db
from app.schemas.token import Token, RefreshRequest
from app.schemas.user import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
    UserOut,
)

import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if data is None or data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = data.get("sub")
    try:
        user = get_user_by_id(db, uuid.UUID(user_id))
    except (ValueError, TypeError):
        user = None

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(subject=str(user.id))
    new_refresh_token = create_refresh_token(subject=str(user.id))
    return Token(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if user and user.is_active:
        token, token_hash = create_password_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )
        set_password_reset_token(db, user, token_hash, expires_at)
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={quote(token)}"
        try:
            send_password_reset_email(user.email, reset_url)
        except (OSError, smtplib.SMTPException):
            user.password_reset_token_hash = None
            user.password_reset_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Reset email could not be sent. Please try again later.",
            )

    return MessageResponse(
        message="If an account exists for that email, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
def complete_password_reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hash_password_reset_token(payload.token)
    user = get_user_by_password_reset_token(db, token_hash)
    now = datetime.now(timezone.utc)
    if (
        not user
        or not user.password_reset_expires_at
        or user.password_reset_expires_at <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has expired.",
        )

    reset_password(db, user, payload.password)
    return MessageResponse(message="Your password has been reset successfully.")
