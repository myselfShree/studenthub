from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate

class NoteService:
    @staticmethod
    def get_by_id(db: Session, note_id: int, user_id: int) -> Optional[Note]:
        """Fetch note by ID ensuring it belongs to the authenticated user."""
        return db.query(Note).options(
            joinedload(Note.subject)
        ).filter(
            Note.id == note_id,
            Note.user_id == user_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        user_id: int,
        subject_id: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Note]:
        """
        List notes with optional filtering by subject_id and full-text keyword search on title/content.
        """
        query = db.query(Note).options(
            joinedload(Note.subject)
        ).filter(Note.user_id == user_id)

        if subject_id is not None:
            query = query.filter(Note.subject_id == subject_id)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Note.title.ilike(search_pattern),
                    Note.content.ilike(search_pattern)
                )
            )

        return query.order_by(Note.updated_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_id: int, note_in: NoteCreate) -> Note:
        """Create a new note."""
        db_note = Note(
            user_id=user_id,
            subject_id=note_in.subject_id,
            title=note_in.title.strip(),
            content=note_in.content
        )
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        return db_note

    @staticmethod
    def update(db: Session, db_note: Note, note_in: NoteUpdate) -> Note:
        """Update existing note fields."""
        if note_in.title is not None:
            db_note.title = note_in.title.strip()
        if note_in.content is not None:
            db_note.content = note_in.content
        if note_in.subject_id is not None:
            db_note.subject_id = note_in.subject_id if note_in.subject_id != 0 else None

        db.commit()
        db.refresh(db_note)
        return db_note

    @staticmethod
    def delete(db: Session, db_note: Note) -> None:
        """Delete note."""
        db.delete(db_note)
        db.commit()

note_service = NoteService()
