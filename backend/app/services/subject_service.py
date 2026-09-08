from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate

class SubjectService:
    @staticmethod
    def get_by_id(db: Session, subject_id: int, user_id: int) -> Optional[Subject]:
        """Get single subject belonging to user."""
        return db.query(Subject).filter(
            Subject.id == subject_id,
            Subject.user_id == user_id
        ).first()

    @staticmethod
    def get_multi_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Subject]:
        """List all subjects for a user ordered by creation date."""
        return db.query(Subject).filter(
            Subject.user_id == user_id
        ).order_by(Subject.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_id: int, subject_in: SubjectCreate) -> Subject:
        """Create new subject for user."""
        subject = Subject(
            user_id=user_id,
            name=subject_in.name.strip(),
            color=subject_in.color.strip() if subject_in.color else "#3B82F6"
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject

    @staticmethod
    def update(db: Session, db_subject: Subject, subject_in: SubjectUpdate) -> Subject:
        """Update subject."""
        if subject_in.name is not None:
            db_subject.name = subject_in.name.strip()
        if subject_in.color is not None:
            db_subject.color = subject_in.color.strip()
        
        db.commit()
        db.refresh(db_subject)
        return db_subject

    @staticmethod
    def delete(db: Session, db_subject: Subject) -> None:
        """Delete subject."""
        db.delete(db_subject)
        db.commit()

subject_service = SubjectService()
