import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.services.user_service import user_service
from app.services.email_service import send_password_reset_email
from app.schemas.user import (
    UserRegister, UserLogin, UserUpdate,
    UserResponse, Token,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.api.deps import get_current_active_user
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Create a new account with strict username and password validation."""
    if user_service.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    user = user_service.create_user(db, user_in=user_in)
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


# ── Login (JSON) ─────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email + password and return a JWT token."""
    user = user_service.authenticate(db, email=user_in.email, password=user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive.")

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


# ── Login (OAuth2 form — Swagger only) ──────────────────────────────────────

@router.post("/login/token", response_model=Token, include_in_schema=False)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = user_service.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


# ── Forgot password ──────────────────────────────────────────────────────────

@router.post("/forgot-password", status_code=200)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send a password-reset email if the account exists.
    Enumeration-safe: Always returns the same response to prevent exposing registered emails.
    Never exposes reset token or link in the API response.
    """
    user = user_service.get_by_email(db, email=payload.email)
    if user and user.is_active:
        token = user_service.create_password_reset_token(db, user)
        frontend_base = getattr(settings, "resolved_frontend_url", settings.FRONTEND_URL)
        reset_link = f"{frontend_base}/reset-password?token={token}"
        email_sent = send_password_reset_email(
            to_email=user.email,
            reset_link=reset_link,
            user_name=user.name,
        )
        if not email_sent:
            logger.warning("Password reset email could not be delivered to %s (check SMTP settings)", user.email)

    return {
        "message": "If an account with that email exists, a password reset link has been sent to your email."
    }


# ── Reset password ───────────────────────────────────────────────────────────

@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate the single-use reset token and set a new password."""
    user = user_service.get_by_reset_token(db, token=payload.token)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )
    user_service.reset_password(db, user=user, new_password=payload.new_password)
    return {"message": "Password updated successfully. You can now log in with your new password."}


# ── Profile ──────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get authenticated user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update profile details (name, email, password) for authenticated user."""
    if user_in.email and user_in.email.lower().strip() != current_user.email.lower().strip():
        existing = user_service.get_by_email(db, email=user_in.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already in use by another account.")
    return user_service.update_user(db, db_user=current_user, user_in=user_in)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    """Stateless logout confirmation."""
    return {"message": "Logged out successfully."}
