from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.note_service import note_service
from app.services.subject_service import subject_service
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()

@router.get("", response_model=List[NoteResponse])
def get_notes(
    subject_id: Optional[int] = Query(None, description="Filter notes by subject ID"),
    search: Optional[str] = Query(None, description="Search keyword in title or content"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List student notes with optional subject filtering and keyword search.
    """
    return note_service.get_multi(
        db,
        user_id=current_user.id,
        subject_id=subject_id,
        search=search,
        skip=skip,
        limit=limit
    )

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new study note. If subject_id is specified, verifies it belongs to the student.
    """
    if note_in.subject_id:
        subject = subject_service.get_by_id(db, subject_id=note_in.subject_id, user_id=current_user.id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject not found or does not belong to you"
            )

    return note_service.create(db, user_id=current_user.id, note_in=note_in)

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get single note by ID."""
    note = note_service.get_by_id(db, note_id=note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_in: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update note title, content, or subject."""
    note = note_service.get_by_id(db, note_id=note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    if note_in.subject_id and note_in.subject_id != note.subject_id:
        subject = subject_service.get_by_id(db, subject_id=note_in.subject_id, user_id=current_user.id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject not found or does not belong to you"
            )

    return note_service.update(db, db_note=note, note_in=note_in)

@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete note."""
    note = note_service.get_by_id(db, note_id=note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    note_service.delete(db, db_note=note)
    return {"message": "Note deleted successfully"}
