from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Request
from fastapi.responses import FileResponse as FastAPIFileResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from pathlib import Path

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.file_service import file_service
from app.services.qr_service import qr_service
from app.schemas.file import (
    FileResponse,
    FileShareCreate,
    FileShareResponse,
    PublicFileShareInfo,
    FileDetailResponse
)
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a file (PDF, notes, assignments, code, etc.).
    Saves file to abstracted storage and creates database record.
    """
    return file_service.upload_file(db, user_id=current_user.id, upload_file=file)

@router.get("", response_model=List[FileDetailResponse])
def get_user_files(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all files uploaded by the authenticated student with active shares."""
    return file_service.get_multi_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{file_id}", response_model=FileDetailResponse)
def get_file_details(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get metadata for a specific uploaded file."""
    file = file_service.get_by_id(db, file_id=file_id, user_id=current_user.id)
    if not file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return file

@router.post("/{file_id}/share", response_model=FileShareResponse, status_code=status.HTTP_201_CREATED)
def create_file_share(
    file_id: int,
    request: Request,
    share_in: Optional[FileShareCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a secure share token and QR link for an uploaded file.
    Supports optional expiration and max downloads limit.
    """
    file = file_service.get_by_id(db, file_id=file_id, user_id=current_user.id)
    if not file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    if share_in is None:
        share_in = FileShareCreate()

    share = file_service.create_share(db, db_file=file, share_in=share_in)
    
    base_url = str(request.base_url).rstrip("/")
    share_url = f"{settings.FRONTEND_URL}/share/{share.share_token}"
    qr_code_url = f"{base_url}{settings.API_V1_STR}/files/shared/{share.share_token}/qr"

    return {
        "id": share.id,
        "file_id": share.file_id,
        "share_token": share.share_token,
        "expires_at": share.expires_at,
        "max_downloads": share.max_downloads,
        "download_count": share.download_count,
        "is_active": share.is_active,
        "created_at": share.created_at,
        "share_url": share_url,
        "qr_code_url": qr_code_url
    }

@router.get("/shared/{share_token}", response_model=PublicFileShareInfo)
def get_public_share_info(
    share_token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to view information about a shared file before downloading.
    """
    share = file_service.get_share_by_token(db, share_token=share_token)
    if not share or not share.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared file not found or inactive")

    base_url = str(request.base_url).rstrip("/")
    download_url = f"{base_url}{settings.API_V1_STR}/files/shared/{share_token}/download"

    return {
        "filename": share.file.filename,
        "file_size": share.file.file_size,
        "mime_type": share.file.mime_type,
        "expires_at": share.expires_at,
        "max_downloads": share.max_downloads,
        "download_count": share.download_count,
        "is_active": share.is_active,
        "download_url": download_url
    }

@router.get("/shared/{share_token}/download")
def download_shared_file(
    share_token: str,
    db: Session = Depends(get_db)
):
    """
    Public download endpoint. Validates token, checks limits/expiration,
    increments download counter, and streams binary file content.
    """
    share, file_metadata = file_service.validate_and_increment_download(db, share_token=share_token)
    
    if not os.path.exists(file_metadata.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical file was moved or deleted from storage")

    return FastAPIFileResponse(
        path=file_metadata.file_path,
        filename=file_metadata.filename,
        media_type=file_metadata.mime_type
    )

@router.get("/shared/{share_token}/qr")
def get_share_qr_image(
    share_token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generates and streams a scannable PNG image of the QR code for this share token.
    """
    share = file_service.get_share_by_token(db, share_token=share_token)
    if not share or not share.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share token not found")

    # The QR code points directly to the frontend share viewer or direct download
    target_url = f"{settings.FRONTEND_URL}/share/{share_token}"
    png_bytes = qr_service.generate_qr_png_bytes(target_url)

    return Response(content=png_bytes, media_type="image/png")

@router.delete("/{file_id}", status_code=status.HTTP_200_OK)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete uploaded file, its disk asset, and all active shares."""
    file = file_service.get_by_id(db, file_id=file_id, user_id=current_user.id)
    if not file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    file_service.delete_file(db, db_file=file)
    return {"message": "File deleted successfully"}
