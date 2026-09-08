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
]
