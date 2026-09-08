from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import date, timedelta
from typing import List, Optional, Dict, Any, Tuple

from app.models.habit import Habit, HabitRecord
from app.schemas.habit import HabitCreate, HabitUpdate, HabitRecordCreate

class HabitService:
    @staticmethod
    def get_by_id(db: Session, habit_id: int, user_id: int) -> Optional[Habit]:
        """Fetch single habit by ID for user."""
        return db.query(Habit).filter(
            Habit.id == habit_id,
            Habit.user_id == user_id
        ).first()

    @staticmethod
    def create(db: Session, user_id: int, habit_in: HabitCreate) -> Habit:
        """Create new habit."""
        db_habit = Habit(
            user_id=user_id,
            name=habit_in.name.strip(),
            description=habit_in.description,
            target_frequency=habit_in.target_frequency
        )
        db.add(db_habit)
        db.commit()
        db.refresh(db_habit)
        return db_habit

    @staticmethod
    def update(db: Session, db_habit: Habit, habit_in: HabitUpdate) -> Habit:
        """Update habit details."""
        if habit_in.name is not None:
            db_habit.name = habit_in.name.strip()
        if habit_in.description is not None:
            db_habit.description = habit_in.description
        if habit_in.target_frequency is not None:
            db_habit.target_frequency = habit_in.target_frequency
        
        db.commit()
        db.refresh(db_habit)
        return db_habit

    @staticmethod
    def delete(db: Session, db_habit: Habit) -> None:
        """Delete habit and all associated completion records."""
        db.delete(db_habit)
        db.commit()

    @staticmethod
    def checkin(db: Session, db_habit: Habit, record_in: HabitRecordCreate) -> HabitRecord:
        """Record daily completion for a habit."""
        target_date = record_in.completed_date or date.today()
        
        # Check if already completed on that date
        existing = db.query(HabitRecord).filter(
            HabitRecord.habit_id == db_habit.id,
            HabitRecord.completed_date == target_date
        ).first()

        if existing:
            return existing

        new_record = HabitRecord(
            habit_id=db_habit.id,
            completed_date=target_date,
            notes=record_in.notes
        )
        db.add(new_record)
        try:
            db.commit()
            db.refresh(new_record)
            return new_record
        except IntegrityError:
            db.rollback()
            return db.query(HabitRecord).filter(
                HabitRecord.habit_id == db_habit.id,
                HabitRecord.completed_date == target_date
            ).first()

    @staticmethod
    def delete_checkin(db: Session, db_habit: Habit, target_date: Optional[date] = None) -> bool:
        """Remove a completion record for a specific date (defaults to today)."""
        check_date = target_date or date.today()
        record = db.query(HabitRecord).filter(
            HabitRecord.habit_id == db_habit.id,
            HabitRecord.completed_date == check_date
        ).first()

        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    @staticmethod
    def compute_habit_metrics(records: List[HabitRecord]) -> Dict[str, Any]:
        """
        Calculates:
        - current_streak (consecutive days counting back from today or yesterday)
        - longest_streak (maximum consecutive sequence of days)
        - total_completions
        - completed_today (True if today is in records)
        - recent_history (sorted list of completed dates)
        """
        if not records:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_completions": 0,
                "completed_today": False,
                "recent_history": []
            }

        dates_set = {r.completed_date for r in records}
        sorted_dates = sorted(list(dates_set))
        today = date.today()
        yesterday = today - timedelta(days=1)

        completed_today = today in dates_set

        # Calculate Current Streak
        current_streak = 0
        if completed_today:
            curr = today
            while curr in dates_set:
                current_streak += 1
                curr -= timedelta(days=1)
        elif yesterday in dates_set:
            curr = yesterday
            while curr in dates_set:
                current_streak += 1
                curr -= timedelta(days=1)
        else:
            current_streak = 0

        # Calculate Longest Streak
        longest_streak = 0
        if sorted_dates:
            temp_streak = 1
            longest_streak = 1
            for i in range(1, len(sorted_dates)):
                if sorted_dates[i] == sorted_dates[i-1] + timedelta(days=1):
                    temp_streak += 1
                else:
                    temp_streak = 1
                if temp_streak > longest_streak:
                    longest_streak = temp_streak

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_completions": len(sorted_dates),
            "completed_today": completed_today,
            "recent_history": sorted_dates[-30:]  # Last 30 completed days
        }

    @staticmethod
    def get_multi_with_stats(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """List all habits with streak stats attached."""
        habits = db.query(Habit).filter(Habit.user_id == user_id).order_by(Habit.created_at.desc()).all()
        results = []
        for h in habits:
            records = db.query(HabitRecord).filter(HabitRecord.habit_id == h.id).all()
            metrics = HabitService.compute_habit_metrics(records)
            results.append({
                "id": h.id,
                "user_id": h.user_id,
                "name": h.name,
                "description": h.description,
                "target_frequency": h.target_frequency,
                "created_at": h.created_at,
                "current_streak": metrics["current_streak"],
                "longest_streak": metrics["longest_streak"],
                "total_completions": metrics["total_completions"],
                "completed_today": metrics["completed_today"],
                "recent_history": metrics["recent_history"]
            })
        return results

habit_service = HabitService()
