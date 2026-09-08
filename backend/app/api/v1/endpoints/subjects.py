from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.subject_service import subject_service
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter()

@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all subjects belonging to the authenticated student."""
    return subject_service.get_multi_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new academic subject."""
    return subject_service.create(db, user_id=current_user.id, subject_in=subject_in)

@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get single subject details by ID."""
    subject = subject_service.get_by_id(db, subject_id=subject_id, user_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_in: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update subject name or color."""
    subject = subject_service.get_by_id(db, subject_id=subject_id, user_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject_service.update(db, db_subject=subject, subject_in=subject_in)

@router.delete("/{subject_id}", status_code=status.HTTP_200_OK)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete subject."""
    subject = subject_service.get_by_id(db, subject_id=subject_id, user_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    subject_service.delete(db, db_subject=subject)
    return {"message": "Subject deleted successfully"}
