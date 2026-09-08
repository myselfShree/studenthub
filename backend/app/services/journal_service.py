from sqlalchemy.orm import Session
from datetime import date, datetime, timezone
from typing import List, Optional

from app.models.journal import DailyJournal
from app.schemas.journal import DailyJournalCreate

class JournalService:
    @staticmethod
    def get_by_date(db: Session, user_id: int, entry_date: date) -> Optional[DailyJournal]:
        """Fetch journal entry for a given date."""
        return db.query(DailyJournal).filter(
            DailyJournal.user_id == user_id,
            DailyJournal.entry_date == entry_date
        ).first()

    @staticmethod
    def get_history(db: Session, user_id: int, limit: int = 30) -> List[DailyJournal]:
        """Fetch recent journal entries."""
        return db.query(DailyJournal).filter(
            DailyJournal.user_id == user_id
        ).order_by(DailyJournal.entry_date.desc()).limit(limit).all()

    @staticmethod
    def save_entry(db: Session, user_id: int, journal_in: DailyJournalCreate) -> DailyJournal:
        """Create or update a 3-point journal entry for today or specified date."""
        target_date = journal_in.entry_date or date.today()
        existing = JournalService.get_by_date(db, user_id=user_id, entry_date=target_date)

        if existing:
            existing.point_win = journal_in.point_win
            existing.point_insight = journal_in.point_insight
            existing.point_improvement = journal_in.point_improvement
            existing.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_entry = DailyJournal(
                user_id=user_id,
                entry_date=target_date,
                point_win=journal_in.point_win,
                point_insight=journal_in.point_insight,
                point_improvement=journal_in.point_improvement
            )
            db.add(new_entry)
            db.commit()
            db.refresh(new_entry)
            return new_entry

journal_service = JournalService()
