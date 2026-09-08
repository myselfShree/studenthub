from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.habit import HabitRecord
from app.services.habit_service import habit_service
from app.schemas.habit import (
    HabitCreate,
    HabitUpdate,
    HabitWithStatsResponse,
    HabitRecordCreate,
    HabitRecordResponse
)

router = APIRouter()

@router.get("", response_model=List[HabitWithStatsResponse])
def get_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all user habits along with dynamic streak and completion metrics."""
    return habit_service.get_multi_with_stats(db, user_id=current_user.id)

@router.post("", response_model=HabitWithStatsResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_in: HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new habit to track."""
    habit = habit_service.create(db, user_id=current_user.id, habit_in=habit_in)
    return {
        "id": habit.id,
        "user_id": habit.user_id,
        "name": habit.name,
        "description": habit.description,
        "target_frequency": habit.target_frequency,
        "created_at": habit.created_at,
        "current_streak": 0,
        "longest_streak": 0,
        "total_completions": 0,
        "completed_today": False,
        "recent_history": []
    }

@router.get("/{habit_id}", response_model=HabitWithStatsResponse)
def get_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get single habit with full streak and calendar metrics."""
    habit = habit_service.get_by_id(db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    
    records = db.query(HabitRecord).filter(HabitRecord.habit_id == habit.id).all()
    metrics = habit_service.compute_habit_metrics(records)
    
    return {
        "id": habit.id,
        "user_id": habit.user_id,
        "name": habit.name,
        "description": habit.description,
        "target_frequency": habit.target_frequency,
        "created_at": habit.created_at,
        "current_streak": metrics["current_streak"],
        "longest_streak": metrics["longest_streak"],
        "total_completions": metrics["total_completions"],
        "completed_today": metrics["completed_today"],
        "recent_history": metrics["recent_history"]
    }

@router.put("/{habit_id}", response_model=HabitWithStatsResponse)
def update_habit(
    habit_id: int,
    habit_in: HabitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update habit details."""
    habit = habit_service.get_by_id(db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    
    updated_habit = habit_service.update(db, db_habit=habit, habit_in=habit_in)
    records = db.query(HabitRecord).filter(HabitRecord.habit_id == updated_habit.id).all()
    metrics = habit_service.compute_habit_metrics(records)

    return {
        "id": updated_habit.id,
        "user_id": updated_habit.user_id,
        "name": updated_habit.name,
        "description": updated_habit.description,
        "target_frequency": updated_habit.target_frequency,
        "created_at": updated_habit.created_at,
        "current_streak": metrics["current_streak"],
        "longest_streak": metrics["longest_streak"],
        "total_completions": metrics["total_completions"],
        "completed_today": metrics["completed_today"],
        "recent_history": metrics["recent_history"]
    }

@router.post("/{habit_id}/checkin", response_model=HabitRecordResponse, status_code=status.HTTP_201_CREATED)
def checkin_habit(
    habit_id: int,
    record_in: Optional[HabitRecordCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark habit completed for today (or specified date)."""
    habit = habit_service.get_by_id(db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    
    if record_in is None:
        record_in = HabitRecordCreate(completed_date=date.today())

    record = habit_service.checkin(db, db_habit=habit, record_in=record_in)
    return record

@router.delete("/{habit_id}/checkin", status_code=status.HTTP_200_OK)
def delete_checkin_habit(
    habit_id: int,
    completed_date: Optional[date] = Query(None, description="Date to undo (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Undo habit completion for today or specific date."""
    habit = habit_service.get_by_id(db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    
    deleted = habit_service.delete_checkin(db, db_habit=habit, target_date=completed_date)
    return {"message": "Check-in removed successfully" if deleted else "No check-in record found for that date"}

@router.delete("/{habit_id}", status_code=status.HTTP_200_OK)
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete habit and its logs."""
    habit = habit_service.get_by_id(db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    
    habit_service.delete(db, db_habit=habit)
    return {"message": "Habit deleted successfully"}
