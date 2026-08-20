from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.health import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
def health_check(response: Response, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        postgres_status = "ok"
    except Exception:
        postgres_status = "error"

    overall = "healthy" if postgres_status == "ok" else "unhealthy"
    if overall == "unhealthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthStatus(overall=overall, postgres=postgres_status)