from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, nullslast, asc
from typing import Dict, Any

from app.models.user import User
from app.models.subject import Subject
from app.models.note import Note
from app.models.task import Task
from app.models.habit import Habit, HabitRecord
from app.models.file import FileMetadata
from app.models.resource import Resource
from app.models.ai_interaction import AIInteraction
from app.services.habit_service import habit_service
from app.schemas.dashboard import DashboardOverviewResponse, MetricCounts, TaskDashboardSummary, HabitDashboardSummary

class DashboardService:
    @staticmethod
    def get_dashboard_summary(db: Session, current_user: User) -> DashboardOverviewResponse:
        user_id = current_user.id

        # 1. Aggregate Counts
        total_subjects = db.query(func.count(Subject.id)).filter(Subject.user_id == user_id).scalar() or 0
        total_notes = db.query(func.count(Note.id)).filter(Note.user_id == user_id).scalar() or 0
        total_tasks = db.query(func.count(Task.id)).filter(Task.user_id == user_id).scalar() or 0
        total_habits = db.query(func.count(Habit.id)).filter(Habit.user_id == user_id).scalar() or 0
        total_files = db.query(func.count(FileMetadata.id)).filter(FileMetadata.user_id == user_id).scalar() or 0
        total_resources = db.query(func.count(Resource.id)).filter(Resource.user_id == user_id).scalar() or 0
        total_ai = db.query(func.count(AIInteraction.id)).filter(AIInteraction.user_id == user_id).scalar() or 0

        # 2. Tasks Summary
        pending_count = db.query(func.count(Task.id)).filter(Task.user_id == user_id, Task.status != "completed").scalar() or 0
        completed_count = db.query(func.count(Task.id)).filter(Task.user_id == user_id, Task.status == "completed").scalar() or 0
        urgent_count = db.query(func.count(Task.id)).filter(Task.user_id == user_id, Task.status != "completed", Task.priority == "urgent").scalar() or 0
        
        upcoming_tasks = db.query(Task).filter(
            Task.user_id == user_id,
            Task.status != "completed"
        ).order_by(
            nullslast(asc(Task.due_date)),
            Task.created_at.desc()
        ).limit(5).all()

        # 3. Habits Summary
        habits_with_stats = habit_service.get_multi_with_stats(db, user_id=user_id)
        completed_today_count = sum(1 for h in habits_with_stats if h.get("completed_today", False))

        # 4. Recent Notes (Top 5)
        recent_notes = db.query(Note).options(
            joinedload(Note.subject)
        ).filter(
            Note.user_id == user_id
        ).order_by(Note.updated_at.desc()).limit(5).all()

        # 5. Recent Resources (Top 5)
        recent_resources = db.query(Resource).options(
            joinedload(Resource.subject)
        ).filter(
            Resource.user_id == user_id
        ).order_by(Resource.created_at.desc()).limit(5).all()

        return DashboardOverviewResponse(
            student_name=current_user.name,
            student_email=current_user.email,
            metrics=MetricCounts(
                total_subjects=total_subjects,
                total_notes=total_notes,
                total_tasks=total_tasks,
                total_habits=total_habits,
                total_files=total_files,
                total_resources=total_resources,
                total_ai_interactions=total_ai
            ),
            tasks=TaskDashboardSummary(
                pending_count=pending_count,
                completed_count=completed_count,
                urgent_count=urgent_count,
                upcoming_tasks=upcoming_tasks
            ),
            habits=HabitDashboardSummary(
                total_habits=total_habits,
                completed_today_count=completed_today_count,
                habits=habits_with_stats
            ),
            recent_notes=recent_notes,
            recent_resources=recent_resources
        )

dashboard_service = DashboardService()
