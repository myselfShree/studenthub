import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegister, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.config import settings


from sqlalchemy import func

class UserService:

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        clean_email = email.lower().strip()
        return db.query(User).filter(func.lower(User.email) == clean_email).first()

    @staticmethod
    def get_by_reset_token(db: Session, token: str) -> Optional[User]:
        """Return user only if the token exists and has not expired."""
        now = datetime.now(timezone.utc)
        user = db.query(User).filter(User.password_reset_token == token).first()
        if not user:
            return None
        # Handle timezone-naive datetimes from DB
        expires = user.password_reset_token_expires
        if expires is None:
            return None
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < now:
            return None
        return user

    @staticmethod
    def create_user(db: Session, user_in: UserRegister) -> User:
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
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        """Return the User on success, None on failure."""
        user = UserService.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def create_password_reset_token(db: Session, user: User) -> str:
        token = secrets.token_urlsafe(48)
        user.password_reset_token = token
        user.password_reset_token_expires = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )
        db.commit()
        return token

    @staticmethod
    def reset_password(db: Session, user: User, new_password: str) -> None:
        user.password_hash = get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_token_expires = None
        db.commit()

    @staticmethod
    def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
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
