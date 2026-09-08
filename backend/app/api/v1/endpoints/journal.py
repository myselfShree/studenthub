from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.journal import DailyJournalCreate, DailyJournalResponse
from app.services.journal_service import journal_service

router = APIRouter()

@router.get("/today", response_model=Optional[DailyJournalResponse])
def get_today_journal(
    entry_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the 3-point journal entry for today or specified date."""
    target_date = entry_date or date.today()
    return journal_service.get_by_date(db, user_id=current_user.id, entry_date=target_date)

@router.post("", response_model=DailyJournalResponse, status_code=status.HTTP_200_OK)
def save_daily_journal(
    journal_in: DailyJournalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create or update 3-point daily journal (Win, Concept Learned, Tomorrow's Focus)."""
    return journal_service.save_entry(db, user_id=current_user.id, journal_in=journal_in)

@router.get("/history", response_model=List[DailyJournalResponse])
def get_journal_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent 3-point journal reflections history."""
    return journal_service.get_history(db, user_id=current_user.id, limit=limit)
