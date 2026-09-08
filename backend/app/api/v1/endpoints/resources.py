from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.resource_service import resource_service
from app.services.subject_service import subject_service
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse

router = APIRouter()

@router.get("", response_model=List[ResourceResponse])
def get_resources(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    resource_type: Optional[str] = Query(None, description="Filter by type: video, article, github, pdf, book, link"),
    search: Optional[str] = Query(None, description="Search in title or notes"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List study resources with subject, type, and keyword search filters."""
    return resource_service.get_multi(
        db,
        user_id=current_user.id,
        subject_id=subject_id,
        resource_type=resource_type,
        search=search,
        skip=skip,
        limit=limit
    )

@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    resource_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save a new learning resource bookmark."""
    if resource_in.subject_id:
        subject = subject_service.get_by_id(db, subject_id=resource_in.subject_id, user_id=current_user.id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject not found or does not belong to you")

    return resource_service.create(db, user_id=current_user.id, resource_in=resource_in)

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get single resource by ID."""
    resource = resource_service.get_by_id(db, resource_id=resource_id, user_id=current_user.id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return resource

@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    resource_in: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update resource details."""
    resource = resource_service.get_by_id(db, resource_id=resource_id, user_id=current_user.id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    if resource_in.subject_id and resource_in.subject_id != resource.subject_id:
        subject = subject_service.get_by_id(db, subject_id=resource_in.subject_id, user_id=current_user.id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject not found or does not belong to you")

    return resource_service.update(db, db_resource=resource, resource_in=resource_in)

@router.delete("/{resource_id}", status_code=status.HTTP_200_OK)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete resource bookmark."""
    resource = resource_service.get_by_id(db, resource_id=resource_id, user_id=current_user.id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    resource_service.delete(db, db_resource=resource)
    return {"message": "Resource deleted successfully"}
