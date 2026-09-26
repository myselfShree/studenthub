import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegister, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.config import settings


class UserService:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Fetch user by primary key ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch user by unique email."""
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def get_by_reset_token(db: Session, token: str) -> Optional[User]:
        """Fetch user by a valid (non-expired) password-reset token."""
        now = datetime.now(timezone.utc)
        return (
            db.query(User)
            .filter(
                User.password_reset_token == token,
                User.password_reset_token_expires > now,
            )
            .first()
        )

    @staticmethod
    def create_user(db: Session, user_in: UserRegister) -> User:
        """Create a new user with hashed password."""
        db_user = User(
            name=user_in.name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password),
            is_active=True,
            failed_login_attempts=0,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> tuple[Optional[User], str]:
        """
        Authenticate user with email and plain password.

        Returns (user, error_code) where error_code is one of:
          - "" — success
          - "not_found" — no account with that email
          - "locked" — account temporarily locked
          - "bad_password" — wrong password (failed attempts incremented)
        """
        user = UserService.get_by_email(db, email=email)
        if not user:
            return None, "not_found"

        # Check account lockout
        now = datetime.now(timezone.utc)
        if user.locked_until:
            locked_until_aware = user.locked_until.replace(tzinfo=timezone.utc) if user.locked_until.tzinfo is None else user.locked_until
            if locked_until_aware > now:
                return None, "locked"
            else:
                # Lock expired — clear it
                user.locked_until = None
                user.failed_login_attempts = 0
                db.commit()

        if not verify_password(password, user.password_hash):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                user.locked_until = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
            db.commit()
            return None, "bad_password"

        # Successful login — reset counters
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
        db.refresh(user)
        return user, ""

    @staticmethod
    def create_password_reset_token(db: Session, user: User) -> str:
        """Generate a cryptographically secure single-use reset token, persist it, and return it."""
        token = secrets.token_urlsafe(48)
        user.password_reset_token = token
        user.password_reset_token_expires = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )
        db.commit()
        return token

    @staticmethod
    def reset_password(db: Session, user: User, new_password: str) -> None:
        """Set new password hash and invalidate the reset token."""
        user.password_hash = get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_token_expires = None
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    @staticmethod
    def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
        """Update existing user properties."""
        if user_in.name is not None:
            db_user.name = user_in.name.strip()
        if user_in.email is not None:
            db_user.email = user_in.email.lower().strip()
        if user_in.password is not None:
            db_user.password_hash = get_password_hash(user_in.password)

        db.commit()
        db.refresh(db_user)
        return db_user


user_service = UserService()
