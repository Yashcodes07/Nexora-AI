from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

# Imported so migration/autogeneration and metadata discover all models.
from app.models import study_plan, user  # noqa: E402,F401
