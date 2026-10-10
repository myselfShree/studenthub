import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.services.user_service import user_service
from app.services.email_service import send_password_reset_email
from app.services.otp_service import otp_service
from app.schemas.user import (
    UserRegister, UserLogin, UserUpdate,
    UserResponse, Token, LoginResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    VerifyRegistrationOTPRequest, ResendOTPRequest,
    VerifyLoginMFARequest, MFAToggleRequest,
)
from app.api.deps import get_current_active_user
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Create a new account and automatically dispatch Email & Mobile OTPs."""
    if user_service.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    user = user_service.create_user(db, user_in=user_in)

    # Generate and dispatch 6-digit OTPs
    try:
        otp_service.generate_and_store_registration_otps(db, user)
    except Exception as exc:
        logger.warning(f"Error dispatching registration OTP: {exc}")

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


# ── Verify Registration OTP ──────────────────────────────────────────────────

@router.post("/verify-registration-otp", response_model=Token)
def verify_registration_otp(payload: VerifyRegistrationOTPRequest, db: Session = Depends(get_db)):
    """Verify 6-digit Email and Mobile OTPs to activate account."""
    user = user_service.get_by_email(db, email=payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    success, message = otp_service.verify_registration_otps(
        db,
        user=user,
        email_otp=payload.email_otp,
        phone_otp=payload.phone_otp
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


# ── Resend Registration / Verification OTP ───────────────────────────────────

@router.post("/resend-otp", status_code=200)
def resend_otp(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    """Resend a fresh 6-digit verification code to the registered email/mobile."""
    user = user_service.get_by_email(db, email=payload.email)
    if not user:
        # Enumeration safe: return success message
        return {"message": "If an account exists, a new verification code has been dispatched."}

    otp_service.generate_and_store_registration_otps(db, user)
    return {"message": "A new verification code has been sent to your email and mobile."}


# ── Login (JSON with optional 2FA / MFA) ─────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email + password. Returns JWT or prompts for MFA OTP."""
    user = user_service.authenticate(db, email=user_in.email, password=user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive.")

    # Check if user has Two-Factor Authentication enabled
    if user.mfa_enabled:
        otp_service.generate_and_store_login_otp(db, user)
        # Short-lived 10-minute temporary MFA token
        mfa_token = create_access_token(
            subject=f"mfa:{user.id}",
            expires_delta=timedelta(minutes=10)
        )
        return LoginResponse(
            mfa_required=True,
            mfa_token=mfa_token,
            message="Two-Factor Authentication is enabled. Please enter the 6-digit code sent to your email and mobile."
        )

    token = create_access_token(subject=user.id)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        mfa_required=False
    )


# ── Verify Login MFA OTP ────────────────────────────────────────────────────

@router.post("/verify-login-mfa", response_model=Token)
def verify_login_mfa(payload: VerifyLoginMFARequest, db: Session = Depends(get_db)):
    """Verify 2FA code from login and issue final JWT access token."""
    try:
        decoded = jwt.decode(
            payload.mfa_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        sub = decoded.get("sub")
        if not sub or not str(sub).startswith("mfa:"):
            raise HTTPException(status_code=400, detail="Invalid MFA session token.")
        user_id = int(str(sub).replace("mfa:", ""))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired MFA session. Please log in again.")

    user = user_service.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    success, message = otp_service.verify_login_otp(db, user=user, otp_code=payload.otp)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


# ── Toggle MFA (Profile Setting) ────────────────────────────────────────────

@router.post("/mfa/toggle", response_model=UserResponse)
def toggle_mfa(
    payload: MFAToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enable or disable Two-Factor Authentication (MFA) for the current user."""
    current_user.mfa_enabled = payload.mfa_enabled
    db.commit()
    db.refresh(current_user)
    return current_user



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


# ── SMTP diagnostic (auth required, never exposes password) ─────────────────

@router.get("/smtp-status")
def smtp_status(current_user: User = Depends(get_current_active_user)):
    """
    Diagnostic: check whether SMTP credentials are configured on this server.
    Returns config status WITHOUT exposing the actual password.
    """
    from app.services.email_service import clean_smtp_credentials
    smtp_user, smtp_password = clean_smtp_credentials()
    user_configured = bool(smtp_user)
    password_configured = bool(smtp_password)
    return {
        "smtp_host": settings.SMTP_HOST,
        "smtp_port": settings.SMTP_PORT,
        "smtp_user_configured": user_configured,
        "smtp_user_value": smtp_user if user_configured else "NOT SET",
        "smtp_password_configured": password_configured,
        "smtp_password_length": len(smtp_password) if smtp_password else 0,
        "frontend_url": getattr(settings, "resolved_frontend_url", settings.FRONTEND_URL),
        "email_ready": user_configured and password_configured,
        "fix_instructions": (
            None if (user_configured and password_configured)
            else (
                "Set SMTP_USER=shreeyadwad@gmail.com and SMTP_PASSWORD=<your-16-char-gmail-app-password> "
                "in your Render dashboard under Environment Variables, then redeploy."
            )
        ),
    }


# ── Live SMTP test (auth required) ──────────────────────────────────────────

@router.post("/test-email")
def test_email(current_user: User = Depends(get_current_active_user)):
    """
    Attempts to send a real test email to the logged-in user's address.
    Returns the exact error message so you can diagnose SMTP issues.
    """
    import smtplib
    from app.services.email_service import clean_smtp_credentials

    smtp_user, smtp_password = clean_smtp_credentials()

    if not smtp_user or not smtp_password:
        return {
            "success": False,
            "error": "SMTP_USER or SMTP_PASSWORD is not set on this server. Go to Render → Environment and add them.",
            "smtp_user_set": bool(smtp_user),
            "smtp_password_set": bool(smtp_password),
        }

    to_email = current_user.email
    subject = "Student Hub — SMTP Test Email"
    body = f"<p>Hello {current_user.name},</p><p>This is a test email from Student Hub. If you received this, SMTP is working correctly!</p>"

    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Student Hub <{smtp_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html", "utf-8"))

    port = int(settings.SMTP_PORT)

    try:
        if port == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())

        return {
            "success": True,
            "message": f"Test email sent to {to_email}. Check your inbox (and spam folder).",
            "smtp_host": settings.SMTP_HOST,
            "smtp_port": port,
            "smtp_user": smtp_user,
        }

    except smtplib.SMTPAuthenticationError as exc:
        return {
            "success": False,
            "error": "SMTP Authentication failed. Your SMTP_PASSWORD is wrong or not a 16-character App Password.",
            "detail": str(exc),
            "fix": "Go to https://myaccount.google.com/apppasswords, create an App Password for 'StudentHub', copy the 16-char code (no spaces) and paste it as SMTP_PASSWORD in Render.",
        }
    except smtplib.SMTPException as exc:
        return {"success": False, "error": f"SMTP error: {exc}"}
    except Exception as exc:
        return {"success": False, "error": f"Unexpected error: {exc}"}


# ── Public SMTP debug (NO auth required — for quick testing only) ────────────

@router.get("/debug-smtp")
def debug_smtp_public(to: str = "shreeyadwad@gmail.com"):
    """
    PUBLIC endpoint (no login needed) — sends a test email and returns
    the exact result so you can diagnose SMTP without logging in via Swagger.

    Usage: GET /api/v1/auth/debug-smtp?to=your@email.com
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from app.services.email_service import clean_smtp_credentials

    smtp_user, smtp_password = clean_smtp_credentials()

    # 1. Check credentials are set
    if not smtp_user or not smtp_password:
        return {
            "success": False,
            "step": "credentials_check",
            "error": "SMTP_USER or SMTP_PASSWORD is NOT set on this server.",
            "smtp_user_set": bool(smtp_user),
            "smtp_user_value": smtp_user or "MISSING",
            "smtp_password_set": bool(smtp_password),
            "smtp_password_length": len(smtp_password) if smtp_password else 0,
            "fix": "Go to Render Dashboard → your backend service → Environment tab → add SMTP_USER and SMTP_PASSWORD (16-char Gmail App Password).",
        }

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Student Hub — SMTP Debug Test"
    msg["From"] = f"Student Hub <{smtp_user}>"
    msg["To"] = to
    msg.attach(MIMEText(
        "<p><b>Student Hub SMTP Test</b></p><p>If you see this email, email delivery is working correctly!</p>",
        "html", "utf-8"
    ))

    host = settings.SMTP_HOST
    attempts = [(587, False), (465, True)]
    errors = []

    for port, use_ssl in attempts:
        try:
            if use_ssl:
                with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to], msg.as_string())
            else:
                with smtplib.SMTP(host, port, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to], msg.as_string())

            return {
                "success": True,
                "message": f"Test email sent to {to} via port {port}. Check your inbox and spam folder.",
                "smtp_host": host,
                "smtp_port": port,
                "smtp_user": smtp_user,
            }

        except smtplib.SMTPAuthenticationError as exc:
            return {
                "success": False,
                "step": f"auth_port_{port}",
                "error": "SMTP Authentication FAILED — your SMTP_PASSWORD is incorrect.",
                "detail": str(exc),
                "smtp_user": smtp_user,
                "smtp_password_length": len(smtp_password),
                "fix": (
                    "Your SMTP_PASSWORD must be a 16-character Gmail App Password (NOT your Gmail login password). "
                    "Go to https://myaccount.google.com/apppasswords → create one for 'StudentHub' → "
                    "copy the code WITHOUT spaces → paste into Render SMTP_PASSWORD env var."
                ),
            }

        except Exception as exc:
            errors.append(f"port {port}: {exc}")
            continue

    return {
        "success": False,
        "step": "all_ports_failed",
        "error": "Could not connect to Gmail SMTP on any port.",
        "attempts": errors,
        "fix": "Check that SMTP_HOST=smtp.gmail.com and that your Render server can reach the internet on ports 587 and 465.",
    }
