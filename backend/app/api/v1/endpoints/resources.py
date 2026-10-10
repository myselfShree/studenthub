from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from pathlib import Path

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.resource import Resource
from app.models.file import FileMetadata
from app.services.resource_service import resource_service
from app.services.subject_service import subject_service
from app.services.storage_service import storage_service
from app.services.file_service import file_service
from app.schemas.file import FileShareCreate
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse

router = APIRouter()

@router.get("", response_model=List[ResourceResponse])
def get_resources(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    resource_type: Optional[str] = Query(None, description="Filter by type: video, article, github, pdf, book, link, image"),
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

@router.post("/upload", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_resource_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload an academic Photo (image) or PDF file directly into Resources.
    Enforces a strict 30MB maximum file size limit.
    """
    MAX_BYTES = 30 * 1024 * 1024  # 30 Megabytes limit

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name cannot be empty")

    # Validate file size
    file.file.seek(0, os.SEEK_END)
    size_bytes = file.file.tell()
    file.file.seek(0)

    if size_bytes > MAX_BYTES:
        max_mb = 30
        actual_mb = size_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the maximum limit of {max_mb}MB (Selected file is {actual_mb:.1f}MB)"
        )

    # Detect resource type
    ext = Path(file.filename).suffix.lower()
    if ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]:
        res_type = "image"
    elif ext in [".pdf"]:
        res_type = "pdf"
    else:
        res_type = "article"

    # Save physical file to user storage
    disk_path, saved_size = storage_service.save_file(file, user_id=current_user.id)

    # Register in file system & generate public download share token
    file_record = FileMetadata(
        user_id=current_user.id,
        filename=file.filename,
        file_path=disk_path,
        file_size=saved_size,
        mime_type=file.content_type or "application/octet-stream"
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    share = file_service.create_share(db, db_file=file_record, share_in=FileShareCreate(expires_in_hours=None))
    download_url = f"/api/v1/files/shared/{share.share_token}/download"

    # Save to resources database
    res_title = title.strip() if title and title.strip() else file.filename
    db_resource = Resource(
        user_id=current_user.id,
        subject_id=subject_id,
        title=res_title,
        url=download_url,
        resource_type=res_type,
        notes=notes
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

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
