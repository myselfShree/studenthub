from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional

class DailyJournalBase(BaseModel):
    entry_date: date
    point_win: str
    point_insight: str
    point_improvement: str

class DailyJournalCreate(BaseModel):
    entry_date: Optional[date] = None
    point_win: str = ""
    point_insight: str = ""
    point_improvement: str = ""

class DailyJournalResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    point_win: str
    point_insight: str
    point_improvement: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
