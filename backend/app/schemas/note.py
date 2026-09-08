from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.schemas.subject import SubjectResponse

# Base Note Schema
class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Supervised vs Unsupervised Learning"])
    content: str = Field(..., min_length=1, description="Note markdown or rich text content")
    subject_id: Optional[int] = Field(None, description="Optional foreign key linking note to subject")

# Note Creation
class NoteCreate(NoteBase):
    pass

# Note Update
class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    subject_id: Optional[int] = None

# Note Response (with nested subject summary if present)
class NoteResponse(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    subject: Optional[SubjectResponse] = None

    model_config = ConfigDict(from_attributes=True)
