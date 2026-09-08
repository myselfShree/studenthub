import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile
from typing import Tuple

from app.core.config import settings

class StorageService:
    def __init__(self, base_upload_dir: str = None):
        if base_upload_dir:
            self.base_dir = Path(base_upload_dir)
        else:
            # Resolved relative to project backend root
            self.base_dir = Path(__file__).resolve().parent.parent.parent / settings.UPLOAD_DIR
        
        # Ensure upload directory exists
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, upload_file: UploadFile, user_id: int) -> Tuple[str, int]:
        """
        Saves uploaded file securely onto the storage disk.
        Returns (relative_file_path, file_size_bytes).
        """
        # User-specific storage subfolder
        user_dir = self.base_dir / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique stored filename to prevent collisions and directory traversal
        file_ext = Path(upload_file.filename or "").suffix
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        destination_path = user_dir / unique_filename

        # Write file content to disk
        file_size = 0
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        file_size = destination_path.stat().st_size
        relative_path = str(destination_path.relative_to(self.base_dir.parent))

        return str(destination_path), file_size

    def delete_file(self, full_path: str) -> bool:
        """Deletes file from storage."""
        try:
            p = Path(full_path)
            if p.exists() and p.is_file():
                p.unlink()
                return True
        except Exception:
            pass
        return False

storage_service = StorageService()
