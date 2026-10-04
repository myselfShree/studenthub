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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-run Alembic migrations on every startup (handles new columns automatically)
    try:
        logger.info("Running Alembic migrations...")
        from alembic.config import Config
        from alembic import command as alembic_command

        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "..", "alembic.ini"))
        alembic_cfg.set_main_option("sqlalchemy.url", settings.sync_database_url)
        alembic_command.upgrade(alembic_cfg, "head")
        logger.info("Migrations applied.")
    except Exception as e:
        logger.warning(f"Alembic migration warning: {e}")
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Fallback: tables created via SQLAlchemy.")
        except Exception as e2:
            logger.error(f"Schema creation failed: {e2}")
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


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation Error", "details": exc.errors()},
    )


@app.get("/", tags=["Root"])
def root():
    return {"message": f"{settings.APP_NAME} API is running", "docs": "/docs"}


app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
