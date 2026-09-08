from sqlalchemy.orm import Session
from sqlalchemy import nullslast, asc
from typing import List, Optional

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:
    @staticmethod
    def get_by_id(db: Session, task_id: int, user_id: int) -> Optional[Task]:
        """Fetch task by ID for the specific user."""
        return db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        user_id: int,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Task]:
        """
        List user tasks with optional status and priority filters.
        Orders by due_date (nearest first, nulls last) and then created_at.
        """
        query = db.query(Task).filter(Task.user_id == user_id)

        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)

        return query.order_by(
            nullslast(asc(Task.due_date)),
            Task.created_at.desc()
        ).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_id: int, task_in: TaskCreate) -> Task:
        """Create a new task."""
        db_task = Task(
            user_id=user_id,
            title=task_in.title.strip(),
            description=task_in.description,
            priority=task_in.priority,
            status=task_in.status,
            due_date=task_in.due_date
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def update(db: Session, db_task: Task, task_in: TaskUpdate) -> Task:
        """Update existing task fields."""
        if task_in.title is not None:
            db_task.title = task_in.title.strip()
        if task_in.description is not None:
            db_task.description = task_in.description
        if task_in.priority is not None:
            db_task.priority = task_in.priority
        if task_in.status is not None:
            db_task.status = task_in.status
        if task_in.due_date is not None:
            db_task.due_date = task_in.due_date

        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def update_status(db: Session, db_task: Task, new_status: str) -> Task:
        """Quick status change (e.g. pending -> completed)."""
        db_task.status = new_status
        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def delete(db: Session, db_task: Task) -> None:
        """Delete task."""
        db.delete(db_task)
        db.commit()

task_service = TaskService()
