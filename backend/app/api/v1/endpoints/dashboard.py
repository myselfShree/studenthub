from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.dashboard_service import dashboard_service
from app.schemas.dashboard import DashboardOverviewResponse

router = APIRouter()

@router.get("/summary", response_model=DashboardOverviewResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Consolidated real-time student dashboard overview.
    Aggregates pending tasks, today's habit check-ins, recent study notes, and quick metrics.
    """
    return dashboard_service.get_dashboard_summary(db, current_user=current_user)
