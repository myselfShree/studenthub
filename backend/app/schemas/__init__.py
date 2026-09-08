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
from app.schemas.ai import (
    AISummarizeRequest,
    AIKeyPointsRequest,
    AIQuizRequest,
    AIExplainRequest,
    AISummaryResponse,
    AIKeyPointsResponse,
    AIQuizQuestion,
    AIQuizResponse,
    AIExplainResponse,
    AIInteractionResponse
)
from app.schemas.resource import (
    ResourceBase,
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse
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
    "AISummarizeRequest",
    "AIKeyPointsRequest",
    "AIQuizRequest",
    "AIExplainRequest",
    "AISummaryResponse",
    "AIKeyPointsResponse",
    "AIQuizQuestion",
    "AIQuizResponse",
    "AIExplainResponse",
    "AIInteractionResponse",
    "ResourceBase",
    "ResourceCreate",
    "ResourceUpdate",
    "ResourceResponse",
]
