from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.services.user_service import user_service
from app.services.email_service import send_password_reset_email
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.api.deps import get_current_active_user
from app.models.user import User
from app.main import limiter

router = APIRouter()


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
def register(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new student account.
    Returns the created user profile and a signed JWT access token.
    Rate-limited to 3 requests per minute per IP.
    """
    existing_user = user_service.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = user_service.create_user(db, user_in=user_in)
    access_token = create_access_token(subject=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


# ---------------------------------------------------------------------------
# Login (JSON)
# ---------------------------------------------------------------------------

@router.post("/login", response_model=Token)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user using JSON credentials (email and password).
    Returns a signed JWT access token.
    Rate-limited to 5 requests per minute per IP.
    Enforces account lockout after 5 consecutive failed attempts (15-minute lock).
    """
    user, error = user_service.authenticate(db, email=user_in.email, password=user_in.password)

    if error == "locked":
        # Tell the client how long the lock lasts (informational)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to too many failed attempts. "
                   f"Please try again in {settings.ACCOUNT_LOCKOUT_MINUTES} minutes.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


# ---------------------------------------------------------------------------
# Login (OAuth2 form — Swagger UI only)
# ---------------------------------------------------------------------------

@router.post("/login/token", response_model=Token, include_in_schema=False)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
def login_for_swagger_docs(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 compatible token login for Swagger /docs Authorize button.
    """
    user, error = user_service.authenticate(db, email=form_data.username, password=form_data.password)

    if error == "locked":
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked. Try again in {settings.ACCOUNT_LOCKOUT_MINUTES} minutes.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


# ---------------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------------

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_FORGOT_PASSWORD)
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Send a password-reset email to the given address if an account exists.
    Always returns 200 — we never reveal whether an email is registered.
    Rate-limited to 3 requests per minute per IP.
    """
    user = user_service.get_by_email(db, email=payload.email)

    if user and user.is_active:
        token = user_service.create_password_reset_token(db, user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(
            to_email=user.email,
            reset_link=reset_link,
            user_name=user.name.split()[0] if user.name else "there",
        )

    # Always return the same response to prevent email enumeration
    return {
        "message": "If an account with that email exists, a password-reset link has been sent."
    }


# ---------------------------------------------------------------------------
# Reset password
# ---------------------------------------------------------------------------

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validate the single-use reset token and set the new password.
    The token is invalidated immediately after use.
    """
    user = user_service.get_by_reset_token(db, token=payload.token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    user_service.reset_password(db, user=user, new_password=payload.new_password)

    return {"message": "Password updated successfully. You can now log in with your new password."}


# ---------------------------------------------------------------------------
# Profile endpoints
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
def read_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Retrieve the current logged-in user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update the current logged-in user's name, email, or password."""
    if user_in.email and user_in.email != current_user.email:
        existing = user_service.get_by_email(db, email=user_in.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is already in use by another account.",
            )

    updated_user = user_service.update_user(db, db_user=current_user, user_in=user_in)
    return updated_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    """
    Stateless logout acknowledgement.
    Client should discard its stored JWT token.
    """
    return {"message": "Successfully logged out"}
