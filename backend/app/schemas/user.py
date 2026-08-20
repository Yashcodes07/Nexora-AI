import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


LearningMethod = Literal["visuals", "short_text", "audio", "step_by_step", "examples"]
ContentAmount = Literal["small_chunks", "moderate", "detailed"]
FocusSupport = Literal[
    "short_sections",
    "progress_indicators",
    "checklists",
    "frequent_breaks",
    "minimal_distractions",
    "uninterrupted",
]
DifficultyStrategy = Literal[
    "simplify",
    "smaller_steps",
    "visual",
    "example",
    "explain_differently",
]
Avoidance = Literal[
    "long_paragraphs",
    "too_much_information",
    "too_many_things",
    "excessive_animations",
    "time_pressure",
    "nothing_specific",
]
NeurodivergentProfile = Literal[
    "adhd",
    "autism",
    "dyslexia",
    "dyspraxia",
    "dyscalculia",
    "other_neurodivergence",
    "prefer_not_to_say",
    "none",
]


class LearningPreferences(BaseModel):
    learning_methods: list[LearningMethod] = Field(min_length=1, max_length=3)
    content_amount: ContentAmount
    focus_support: list[FocusSupport] = Field(min_length=1, max_length=2)
    difficulty_strategy: DifficultyStrategy
    avoidances: list[Avoidance] = Field(min_length=1)
    neurodivergent_profiles: list[NeurodivergentProfile] = Field(default_factory=list, max_length=1)

    @model_validator(mode="after")
    def validate_choices(self):
        if len(set(self.learning_methods)) != len(self.learning_methods):
            raise ValueError("Learning methods must be unique")
        if len(set(self.focus_support)) != len(self.focus_support):
            raise ValueError("Focus preferences must be unique")
        if len(set(self.avoidances)) != len(self.avoidances):
            raise ValueError("Avoidance preferences must be unique")
        if "nothing_specific" in self.avoidances and len(self.avoidances) > 1:
            raise ValueError("Nothing specific cannot be combined with other avoidances")
        if len(set(self.neurodivergent_profiles)) != len(self.neurodivergent_profiles):
            raise ValueError("Neurodivergent profiles must be unique")
        exclusive_profiles = {"prefer_not_to_say", "none"}
        if exclusive_profiles.intersection(self.neurodivergent_profiles) and len(
            self.neurodivergent_profiles
        ) > 1:
            raise ValueError("No / none and prefer not to say must be selected alone")
        return self


class LearningPreferencesUpdate(LearningPreferences):
    @model_validator(mode="after")
    def require_profile_answer(self):
        if not self.neurodivergent_profiles:
            raise ValueError("Please answer whether any of the listed profiles describe you")
        return self


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    is_superuser: bool
    learning_preferences: Optional[LearningPreferences] = None
    created_at: datetime
