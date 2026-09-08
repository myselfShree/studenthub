from sqlalchemy.orm import Session
from typing import Optional

from app.models.user import User
from app.schemas.user import UserRegister, UserUpdate
from app.core.security import get_password_hash, verify_password

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
    def create_user(db: Session, user_in: UserRegister) -> User:
        """Create a new user with hashed password."""
        db_user = User(
            name=user_in.name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password),
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and plain password."""
        user = UserService.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

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
