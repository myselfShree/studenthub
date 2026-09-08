from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

from app.schemas.task import TaskResponse
from app.schemas.habit import HabitWithStatsResponse
from app.schemas.note import NoteResponse
from app.schemas.resource import ResourceResponse

class MetricCounts(BaseModel):
    total_subjects: int
    total_notes: int
    total_tasks: int
    total_habits: int
    total_files: int
    total_resources: int
    total_ai_interactions: int

class TaskDashboardSummary(BaseModel):
    pending_count: int
    completed_count: int
    urgent_count: int
    upcoming_tasks: List[TaskResponse]

class HabitDashboardSummary(BaseModel):
    total_habits: int
    completed_today_count: int
    habits: List[HabitWithStatsResponse]

class DashboardOverviewResponse(BaseModel):
    student_name: str
    student_email: str
    metrics: MetricCounts
    tasks: TaskDashboardSummary
    habits: HabitDashboardSummary
    recent_notes: List[NoteResponse]
    recent_resources: List[ResourceResponse]

    model_config = ConfigDict(from_attributes=True)
