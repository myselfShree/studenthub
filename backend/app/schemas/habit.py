from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List

# Habit Record Schemas
class HabitRecordCreate(BaseModel):
    completed_date: Optional[date] = Field(default_factory=date.today, description="Date of completion (defaults to today)")
    notes: Optional[str] = Field(None, description="Optional brief reflection or note")

class HabitRecordResponse(BaseModel):
    id: int
    habit_id: int
    completed_date: date
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Base Habit Schema
class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, examples=["Study 2 Hours Daily"])
    description: Optional[str] = Field(None, examples=["DSA or Core Subjects"])
    target_frequency: str = Field("daily", examples=["daily", "weekdays", "custom"])

# Habit Creation
class HabitCreate(HabitBase):
    pass

# Habit Update
class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    target_frequency: Optional[str] = None

# Habit Simple Response
class HabitResponse(HabitBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Habit Response with Streak and Activity Stats
class HabitWithStatsResponse(HabitResponse):
    current_streak: int = 0
    longest_streak: int = 0
    total_completions: int = 0
    completed_today: bool = False
    recent_history: List[date] = []

    model_config = ConfigDict(from_attributes=True)
