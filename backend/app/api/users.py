from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user
from app.crud.user import update_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return update_user(db, current_user, user_in)
