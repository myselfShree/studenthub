from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from typing import Dict, Any

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK, response_model=Dict[str, Any])
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Health check endpoint.
    Verifies that the FastAPI server and PostgreSQL database connection are both healthy.
    """
    db_status = "healthy"
    db_latency_ms = None

    try:
        start_time = datetime.now(timezone.utc)
        db.execute(text("SELECT 1"))
        end_time = datetime.now(timezone.utc)
        db_latency_ms = round((end_time - start_time).total_seconds() * 1000, 2)
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms
        }
    }
