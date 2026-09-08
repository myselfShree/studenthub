from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from typing import Optional, List, Any

# File Metadata Response
class FileResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size: int
    mime_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# File Share Creation
class FileShareCreate(BaseModel):
    expires_in_hours: Optional[int] = Field(None, ge=1, le=720, description="Expiration time in hours (1h - 30 days)")
    expires_hours: Optional[int] = Field(None, ge=1, le=720, description="Alias for expires_in_hours")
    max_downloads: Optional[int] = Field(None, ge=1, le=1000, description="Max allowed downloads before link expires")

    @model_validator(mode='before')
    @classmethod
    def normalize_hours(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if values.get('expires_hours') and not values.get('expires_in_hours'):
                values['expires_in_hours'] = values['expires_hours']
        return values

# File Share Response
class FileShareResponse(BaseModel):
    id: int
    file_id: int
    share_token: str
    expires_at: Optional[datetime] = None
    max_downloads: Optional[int] = None
    download_count: int
    is_active: bool
    created_at: datetime
    share_url: Optional[str] = None
    qr_code_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Public File Share Info (safe payload for public viewers)
class PublicFileShareInfo(BaseModel):
    filename: str
    file_size: int
    mime_type: str
    expires_at: Optional[datetime] = None
    max_downloads: Optional[int] = None
    download_count: int
    is_active: bool
    download_url: str

# File Details with associated Shares
class FileDetailResponse(FileResponse):
    shares: List[FileShareResponse] = []

    model_config = ConfigDict(from_attributes=True)
