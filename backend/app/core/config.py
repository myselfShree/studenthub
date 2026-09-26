from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional
from pathlib import Path
import re

# Project root directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "Student Hub"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # SECRET_KEY is required — no default. Will raise at startup if missing.
    SECRET_KEY: str

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "root"
    POSTGRES_DB: str = "studenthub_db"
    DATABASE_URL: Optional[str] = None

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            # 1. Normalize protocol to postgresql+psycopg2://
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

            # 2. Clean Neon query params (remove channel_binding if present as it can cause psycopg2 negotiation errors)
            if "channel_binding" in url:
                url = re.sub(r'([?&])channel_binding=[^&]*', '', url)
                url = url.replace('?&', '?').rstrip('?').rstrip('&')

            return url
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # JWT Authentication
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # AI Integration
    GEMINI_API_KEY: Optional[str] = ""

    # File Storage
    UPLOAD_DIR: str = "storage/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Email (Brevo)
    BREVO_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@studenthub.app"
    EMAIL_FROM_NAME: str = "Student Hub"

    # Password Reset
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # Rate Limiting (requests per window)
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_FORGOT_PASSWORD: str = "3/minute"

    # Account Lockout
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    @model_validator(mode="after")
    def _require_secret_key(self):
        if not self.SECRET_KEY or self.SECRET_KEY.strip() == "":
            raise ValueError(
                "SECRET_KEY environment variable is required and must not be empty. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return self

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
