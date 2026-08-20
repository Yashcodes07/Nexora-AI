import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import LearningPreferences, UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, user_in: UserUpdate) -> User:
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.password:
        user.hashed_password = hash_password(user_in.password)
    db.commit()
    db.refresh(user)
    return user


def update_learning_preferences(
    db: Session, user: User, preferences: LearningPreferences
) -> User:
    user.learning_preferences = preferences.model_dump(mode="json")
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def set_password_reset_token(
    db: Session, user: User, token_hash: str, expires_at: datetime
) -> None:
    user.password_reset_token_hash = token_hash
    user.password_reset_expires_at = expires_at
    db.commit()


def get_user_by_password_reset_token(db: Session, token_hash: str) -> Optional[User]:
    return (
        db.query(User)
        .filter(User.password_reset_token_hash == token_hash)
        .first()
    )


def reset_password(db: Session, user: User, password: str) -> User:
    user.hashed_password = hash_password(password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.commit()
    db.refresh(user)
    return user
