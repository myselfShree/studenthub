from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Literal

PriorityType = Literal["low", "medium", "high", "urgent"]
StatusType = Literal["pending", "in_progress", "completed"]

# Base Task Schema
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Complete Machine Learning Assignment 2"])
    description: Optional[str] = Field(None, examples=["Submit Jupyter notebook with CNN model"])
    priority: PriorityType = Field("medium", examples=["high"])
    status: StatusType = Field("pending", examples=["pending"])
    due_date: Optional[datetime] = None

# Task Creation Schema
class TaskCreate(TaskBase):
    pass

# Task Update Schema
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[PriorityType] = None
    status: Optional[StatusType] = None
    due_date: Optional[datetime] = None

# Task Status Quick Update
class TaskStatusUpdate(BaseModel):
    status: StatusType = Field(..., examples=["completed"])

# Task Response Schema
class TaskResponse(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
