# Re-export all models and Base for easy access and Alembic auto-discovery
from app.core.database import Base
from app.models.user import User
from app.models.subject import Subject
from app.models.note import Note
from app.models.task import Task
from app.models.habit import Habit, HabitRecord
from app.models.file import FileMetadata, FileShare
from app.models.resource import Resource
from app.models.ai_interaction import AIInteraction

__all__ = [
    "Base",
    "User",
    "Subject",
    "Note",
    "Task",
    "Habit",
    "HabitRecord",
    "FileMetadata",
    "FileShare",
    "Resource",
    "AIInteraction",
]
