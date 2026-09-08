from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

# Base Subject Schema
class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Machine Learning"])
    color: str = Field("#3B82F6", max_length=20, examples=["#3B82F6"])

# Subject Creation
class SubjectCreate(SubjectBase):
    pass

# Subject Update
class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)

# Subject Response (includes id, user_id, timestamps)
class SubjectResponse(SubjectBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
