from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path
import re

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Student Hub"
    APP_ENV: str = "development"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # JWT — must be set in .env / Render env vars
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "root"
    POSTGRES_DB: str = "studenthub_db"

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            if "channel_binding" in url:
                url = re.sub(r'([?&])channel_binding=[^&]*', '', url)
                url = url.replace('?&', '?').rstrip('?').rstrip('&')
            return url
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # SMTP Email — fallback for local dev only (blocked by Render free tier)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@studenthub.app"
    EMAIL_FROM_NAME: str = "Student Hub"

    # Resend (alternative — requires verified domain for sending to all users)
    RESEND_API_KEY: Optional[str] = None
    RESEND_FROM_EMAIL: Optional[str] = None

    # Brevo / Sendinblue (RECOMMENDED — no domain needed, just verify sender Gmail)
    # Sign up free at https://app.brevo.com → SMTP & API → API Keys
    BREVO_API_KEY: Optional[str] = None
    BREVO_SENDER_EMAIL: Optional[str] = None   # e.g. shreeyadwad@gmail.com (must be verified in Brevo)
    BREVO_SENDER_NAME: str = "Student Hub"

    # Password reset token expiry
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # AI
    GEMINI_API_KEY: Optional[str] = ""

    # SMS (Fast2SMS)
    FAST2SMS_API_KEY: Optional[str] = None

    # File storage
    UPLOAD_DIR: str = "storage/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def resolved_frontend_url(self) -> str:
        import os
        if self.FRONTEND_URL and self.FRONTEND_URL.strip() != "http://localhost:3000":
            return self.FRONTEND_URL.strip().rstrip("/")
        if os.environ.get("RENDER") or self.APP_ENV == "production":
            return "https://studenthub-amber.vercel.app"
        return (self.FRONTEND_URL or "http://localhost:3000").strip().rstrip("/")

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
