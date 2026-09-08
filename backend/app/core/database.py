from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.core.config import settings

# Create SQLAlchemy Database Engine
engine = create_engine(
    settings.sync_database_url,
    pool_pre_ping=True,  # Automatically check if connection is alive
    echo=settings.DEBUG   # Log SQL queries in debug mode
)

# Create SessionLocal class for instantiating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for all SQLAlchemy models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Ensures the session is always closed after request lifecycle ends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
