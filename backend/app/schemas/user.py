from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional

# Base User Properties
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Alex Sharma"])
    email: EmailStr = Field(..., examples=["alex@studenthub.dev"])

# User Registration Payload
class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Plain text password (min 6 characters)")

# User Login Payload
class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["alex@studenthub.dev"])
    password: str = Field(..., min_length=1)

# User Update Payload
class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)

# User Response Schema (Excludes password_hash)
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Token Data embedded in JWT sub
class TokenData(BaseModel):
    user_id: Optional[int] = None

# Forgot-password request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., examples=["alex@studenthub.dev"])

# Reset-password request
class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Single-use reset token from the email link")
    new_password: str = Field(..., min_length=6, max_length=100, description="New password (min 6 characters)")
