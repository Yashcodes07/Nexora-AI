from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.deps import get_current_active_user
from app.models.user import User


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/learning-space")
def learning_space(current_user: User = Depends(get_current_active_user)):
    return {
        "title": "Learning Space",
        "description": "Learn in a format shaped around your preferences.",
        "preferences": current_user.learning_preferences,
        "courses": [],
        "recommended": [],
    }


@router.get("/wellbeing")
def wellbeing(current_user: User = Depends(get_current_active_user)):
    return {
        "title": "Wellbeing",
        "description": "Keep learning sustainable with gentle check-ins and breaks.",
        "check_in": None,
        "streak_days": 0,
        "suggestions": [
            "Take a two-minute screen break",
            "Choose one small goal for this session",
            "Use a short breathing reset before you begin",
        ],
    }


@router.get("/ai-scheduler")
def ai_scheduler(current_user: User = Depends(get_current_active_user)):
    return {
        "title": "AI Scheduler",
        "description": "Turn your goals into a calm, achievable learning plan.",
        "today": datetime.now(timezone.utc).date().isoformat(),
        "events": [],
        "suggested_focus_minutes": 25,
    }


@router.get("/settings")
def dashboard_settings(current_user: User = Depends(get_current_active_user)):
    return {
        "title": "Settings",
        "account": {"full_name": current_user.full_name, "email": current_user.email},
        "learning_preferences": current_user.learning_preferences,
        "available_controls": ["profile", "password", "learning_preferences"],
    }


@router.get("/profile")
def dashboard_profile(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "member_since": current_user.created_at,
        "learning_preferences": current_user.learning_preferences,
    }
