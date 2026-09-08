# Export all schemas
from app.schemas.user import (
    UserBase,
    UserRegister,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token,
    TokenData
)
from app.schemas.subject import (
    SubjectBase,
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse
)
from app.schemas.note import (
    NoteBase,
    NoteCreate,
    NoteUpdate,
    NoteResponse
)
from app.schemas.task import (
    TaskBase,
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskResponse
)
from app.schemas.habit import (
    HabitBase,
    HabitCreate,
    HabitUpdate,
    HabitResponse,
    HabitWithStatsResponse,
    HabitRecordCreate,
    HabitRecordResponse
)
from app.schemas.file import (
    FileResponse,
    FileShareCreate,
    FileShareResponse,
    PublicFileShareInfo,
    FileDetailResponse
)

__all__ = [
    "UserBase",
    "UserRegister",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenData",
    "SubjectBase",
    "SubjectCreate",
    "SubjectUpdate",
    "SubjectResponse",
    "NoteBase",
    "NoteCreate",
    "NoteUpdate",
    "NoteResponse",
    "TaskBase",
    "TaskCreate",
    "TaskUpdate",
    "TaskStatusUpdate",
    "TaskResponse",
    "HabitBase",
    "HabitCreate",
    "HabitUpdate",
    "HabitResponse",
    "HabitWithStatsResponse",
    "HabitRecordCreate",
    "HabitRecordResponse",
    "FileResponse",
    "FileShareCreate",
    "FileShareResponse",
    "PublicFileShareInfo",
    "FileDetailResponse",
]
