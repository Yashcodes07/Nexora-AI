from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "My App"

    # Database
    DATABASE_URL: str

    # JWT
    # Fixed local-demo key. Override before any public deployment.
    SECRET_KEY: str = "nexora-local-demo-signing-key-not-for-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Password reset email
    FRONTEND_URL: str = "http://localhost:3000"
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    SMTP_HOST: str = "mailpit"
    SMTP_PORT: int = 1025
    SMTP_FROM: str = "Nexora AI <no-reply@nexora.local>"
    SMTP_USE_TLS: bool = False
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Hugging Face inference (keep tokens server-side)
    HF_TUTOR_MODEL: str = "Qwen/Qwen3-4B-Instruct-2507"
    HF_TUTOR_TOKEN: Optional[str] = None
    HF_WELLBEING_MODEL: str = "Qwen/Qwen3-4B-Instruct-2507"
    HF_WELLBEING_TOKEN: Optional[str] = None
    HF_SCHEDULER_MODEL: str = "Qwen/Qwen3-4B-Instruct-2507"
    HF_SCHEDULER_TOKEN: Optional[str] = None
    HF_SPEECH_MODEL: str = "openai/whisper-large-v3-turbo"
    HF_SPEECH_TOKEN: Optional[str] = None
    HF_TTS_MODEL: str = "hexgrad/Kokoro-82M"
    HF_TTS_TOKEN: Optional[str] = None
    HF_EMBEDDING_MODEL: str = "Qwen/Qwen3-Embedding-0.6B"
    HF_EMBEDDING_TOKEN: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
