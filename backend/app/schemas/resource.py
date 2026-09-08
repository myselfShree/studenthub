from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from datetime import datetime
from typing import Optional, Literal
from app.schemas.subject import SubjectResponse

ResourceType = Literal["video", "article", "github", "pdf", "book", "link"]

# Base Resource Schema
class ResourceBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Stanford CS229 ML Course Lectures"])
    url: str = Field(..., min_length=1, max_length=1000, examples=["https://youtube.com/playlist?list=..."])
    resource_type: ResourceType = Field("link", examples=["video"])
    notes: Optional[str] = Field(None, examples=["Comprehensive lecture series by Andrew Ng"])
    subject_id: Optional[int] = Field(None, description="Optional foreign key linking to a subject")

# Resource Creation
class ResourceCreate(ResourceBase):
    pass

# Resource Update
class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = Field(None, min_length=1, max_length=1000)
    resource_type: Optional[ResourceType] = None
    notes: Optional[str] = None
    subject_id: Optional[int] = None

# Resource Response
class ResourceResponse(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    title: str
    url: str
    resource_type: str
    notes: Optional[str] = None
    created_at: datetime
    subject: Optional[SubjectResponse] = None

    model_config = ConfigDict(from_attributes=True)
