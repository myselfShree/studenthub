import secrets
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, timedelta
from fastapi import UploadFile, HTTPException, status
from typing import List, Optional, Tuple

from app.models.file import FileMetadata, FileShare
from app.schemas.file import FileShareCreate
from app.services.storage_service import storage_service
from app.core.config import settings

class FileService:
    @staticmethod
    def upload_file(db: Session, user_id: int, upload_file: UploadFile) -> FileMetadata:
        """Saves file to disk and creates FileMetadata database entry."""
        if not upload_file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename cannot be empty")

        disk_path, file_size = storage_service.save_file(upload_file, user_id=user_id)
        
        # Determine mime type
        mime_type = upload_file.content_type or "application/octet-stream"

        db_file = FileMetadata(
            user_id=user_id,
            filename=upload_file.filename,
            file_path=disk_path,
            file_size=file_size,
            mime_type=mime_type
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        return db_file

    @staticmethod
    def get_by_id(db: Session, file_id: int, user_id: int) -> Optional[FileMetadata]:
        """Fetch file metadata by ID for user."""
        return db.query(FileMetadata).options(
            joinedload(FileMetadata.shares)
        ).filter(
            FileMetadata.id == file_id,
            FileMetadata.user_id == user_id
        ).first()

    @staticmethod
    def get_multi_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[FileMetadata]:
        """List all files uploaded by user."""
        return db.query(FileMetadata).filter(
            FileMetadata.user_id == user_id
        ).order_by(FileMetadata.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_share(db: Session, db_file: FileMetadata, share_in: FileShareCreate) -> FileShare:
        """Generates a unique share token with optional expiration and download limits."""
        # Secure URL-safe random token
        share_token = secrets.token_urlsafe(16)

        expires_at = None
        if share_in.expires_in_hours:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=share_in.expires_in_hours)

        share = FileShare(
            file_id=db_file.id,
            share_token=share_token,
            expires_at=expires_at,
            max_downloads=share_in.max_downloads,
            download_count=0,
            is_active=True
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        return share

    @staticmethod
    def get_share_by_token(db: Session, share_token: str) -> Optional[FileShare]:
        """Fetch FileShare by token, including associated file metadata."""
        return db.query(FileShare).options(
            joinedload(FileShare.file)
        ).filter(
            FileShare.share_token == share_token
        ).first()

    @staticmethod
    def validate_and_increment_download(db: Session, share_token: str) -> Tuple[FileShare, FileMetadata]:
        """
        Validates whether the share link is valid, not expired, and has remaining download quota.
        Increments download count atomically upon success.
        """
        share = FileService.get_share_by_token(db, share_token=share_token)
        if not share or not share.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found or inactive")

        # Expiration Check
        if share.expires_at:
            # Normalize to UTC for comparison
            now = datetime.now(timezone.utc)
            if share.expires_at.tzinfo is None:
                share_exp = share.expires_at.replace(tzinfo=timezone.utc)
            else:
                share_exp = share.expires_at
                
            if now > share_exp:
                share.is_active = False
                db.commit()
                raise HTTPException(status_code=status.HTTP_410_GONE, detail="This share link has expired")

        # Max Downloads Check
        if share.max_downloads and share.download_count >= share.max_downloads:
            share.is_active = False
            db.commit()
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Maximum download limit reached for this share link")

        # Increment download count
        share.download_count += 1
        db.commit()
        db.refresh(share)

        return share, share.file

    @staticmethod
    def delete_file(db: Session, db_file: FileMetadata) -> None:
        """Deletes physical file from disk and removes database records."""
        storage_service.delete_file(db_file.file_path)
        db.delete(db_file)
        db.commit()

file_service = FileService()
