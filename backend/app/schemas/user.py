import re
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional

# Username: strictly alphabetic, 2 to 30 characters
USERNAME_REGEX = re.compile(r"^[A-Za-z]+$")

# Password complexity checks
PASSWORD_UPPER = re.compile(r"[A-Z]")
PASSWORD_LOWER = re.compile(r"[a-z]")
PASSWORD_DIGIT = re.compile(r"\d")
PASSWORD_SPECIAL = re.compile(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\/`~;']")


def validate_username_str(value: str) -> str:
    if not value:
        raise ValueError("Username cannot be empty.")
    if len(value) < 2:
        raise ValueError("Username must be at least 2 characters long.")
    if len(value) > 30:
        raise ValueError("Username cannot exceed 30 characters.")
    if not USERNAME_REGEX.match(value):
        raise ValueError("Username must contain alphabets only (no numbers, spaces, or special characters).")
    return value


def validate_password_str(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(value) > 100:
        raise ValueError("Password cannot exceed 100 characters.")
    if not PASSWORD_UPPER.search(value):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not PASSWORD_LOWER.search(value):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not PASSWORD_DIGIT.search(value):
        raise ValueError("Password must contain at least one number.")
    if not PASSWORD_SPECIAL.search(value):
        raise ValueError("Password must contain at least one special character.")
    return value


# Phone validation: allows optional +, digits, min 10 max 15 digits
PHONE_REGEX = re.compile(r"^\+?[0-9]{10,15}$")

def validate_phone_str(value: Optional[str]) -> Optional[str]:
    if not value or not str(value).strip():
        return None
    cleaned = str(value).strip().replace(" ", "").replace("-", "")
    if not PHONE_REGEX.match(cleaned):
        raise ValueError("Invalid phone number format. Provide 10-15 digits (e.g. +919876543210 or 9876543210).")
    return cleaned


# Base User Properties
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=30, examples=["Shrikant"])
    email: EmailStr = Field(..., examples=["shrikant@studenthub.dev"])
    phone_number: Optional[str] = Field(None, examples=["+919876543210"])

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_username_str(v)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_phone_str(v)


# User Registration Payload
class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=100, description="Plain text password (min 8 characters)")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_str(v)


# User Login Payload
class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["shrikant@studenthub.dev"])
    password: str = Field(..., min_length=1)


# User Update Payload
class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=30)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_update_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_username_str(v)
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_update_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_phone_str(v)

    @field_validator("password")
    @classmethod
    def validate_update_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_password_str(v)
        return v


# User Response Schema (Excludes password_hash)
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_email_verified: bool = False
    is_phone_verified: bool = False
    mfa_enabled: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Login Response (supports immediate token or MFA prompt)
class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserResponse] = None
    mfa_required: bool = False
    mfa_token: Optional[str] = None
    message: Optional[str] = None


# Registration OTP Verification Request
class VerifyRegistrationOTPRequest(BaseModel):
    email: EmailStr
    email_otp: str = Field(..., min_length=4, max_length=10, description="6-digit email OTP")
    phone_otp: Optional[str] = Field(None, max_length=10, description="6-digit mobile OTP if registered")


# Resend OTP Request
class ResendOTPRequest(BaseModel):
    email: EmailStr
    otp_type: Optional[str] = Field("all", description="'email', 'phone', or 'all'")


# Login 2FA Verification Request
class VerifyLoginMFARequest(BaseModel):
    mfa_token: str = Field(..., min_length=1, description="Temporary MFA session token from login")
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit 2FA code")


# MFA Toggle Request
class MFAToggleRequest(BaseModel):
    mfa_enabled: bool


# Token Data embedded in JWT sub
class TokenData(BaseModel):
    user_id: Optional[int] = None


# Forgot-password request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., examples=["shrikant@studenthub.dev"])


# Reset-password request
class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Single-use reset token from the email link")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password (min 8 characters)")

    @field_validator("new_password")
    @classmethod
    def validate_reset_password(cls, v: str) -> str:
        return validate_password_str(v)

