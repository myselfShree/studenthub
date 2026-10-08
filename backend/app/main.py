from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
import app.models  # registers all ORM models

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("studenthub")


from sqlalchemy import text
from pathlib import Path

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Base table creation
    try:
        logger.info("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Base tables checked/created.")
    except Exception as e:
        logger.warning(f"Metadata create_all: {e}")

    # 2. Add security & MFA columns to users table if not already present (PostgreSQL safe idempotence)
    try:
        logger.info("Ensuring users table security & MFA columns exist...")
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(10);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMPTZ;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp VARCHAR(10);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMPTZ;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_expires TIMESTAMPTZ;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;"))
        logger.info("Security & MFA columns ensured.")
    except Exception as e:
        logger.warning(f"Users column migration notice: {e}")

    # 3. Auto-run Alembic migrations if alembic.ini is found
    try:
        backend_dir = Path(__file__).resolve().parent.parent
        ini_path = backend_dir / "alembic.ini"
        if ini_path.exists():
            from alembic.config import Config
            from alembic import command as alembic_command

            alembic_cfg = Config(str(ini_path))
            alembic_cfg.set_main_option("sqlalchemy.url", settings.sync_database_url)
            alembic_command.upgrade(alembic_cfg, "head")
            logger.info("Alembic migrations applied.")
    except Exception as e:
        logger.warning(f"Alembic auto-upgrade notice: {e}")

    # 4. Synchronize user credentials if existing
    try:
        from app.core.database import SessionLocal
        from app.models.user import User
        from app.core.security import get_password_hash
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == "shreeyadwad@gmail.com").first()
            if user:
                user.password_hash = get_password_hash("Shri@2k04")
                user.is_active = True
                user.failed_login_attempts = 0
                user.locked_until = None
                db.commit()
                logger.info("Synchronized credentials for shreeyadwad@gmail.com")
    except Exception as e:
        logger.warning(f"Credential sync notice: {e}")

    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Student Hub REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Extract friendly first error message if available
    errors = exc.errors()
    friendly_msg = "Validation Error"
    if errors:
        first = errors[0]
        msg = first.get("msg", "")
        # Remove 'Value error, ' prefix if present from Pydantic
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        friendly_msg = msg or friendly_msg
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": friendly_msg, "errors": jsonable_encoder(errors)},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    # Mask raw exception string from clients in production to prevent DB schema / credentials leakage
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "version": settings.VERSION,
    }


app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
