"""
Local filesystem storage engine.
Stores files in the local filesystem under MEDIA_ROOT.
"""

import os
from pathlib import Path
from typing import BinaryIO, Optional
from django.conf import settings

from .base import BaseStorageEngine, StorageException


class LocalStorageEngine(BaseStorageEngine):
    """
    Local filesystem storage implementation.
    
    Files are stored in MEDIA_ROOT with the provided path structure.
    URLs are generated using MEDIA_URL.
    """
    
    def __init__(self):
        """Initialize local storage with media root directory."""
        self.storage_root = Path(settings.MEDIA_ROOT)
        self.storage_root.mkdir(parents=True, exist_ok=True)
    
    def save(self, file_obj: BinaryIO, path: str) -> str:
        """
        Save file to local filesystem.
        
        Creates necessary parent directories if they don't exist.
        """
        try:
            full_path = self.storage_root / path
            
            # Create parent directories
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file
            with open(full_path, 'wb') as f:
                for chunk in file_obj.chunks() if hasattr(file_obj, 'chunks') else [file_obj.read()]:
                    f.write(chunk)
            
            return path
            
        except Exception as e:
            raise StorageException(f"Failed to save file to local storage: {str(e)}")
    
    def delete(self, path: str) -> bool:
        """Delete file from local filesystem."""
        try:
            full_path = self.storage_root / path
            if full_path.exists():
                full_path.unlink()
                
                # Clean up empty parent directories
                try:
                    full_path.parent.rmdir()
                except OSError:
                    # Directory not empty, that's fine
                    pass
                
                return True
            return False
            
        except Exception as e:
            raise StorageException(f"Failed to delete file from local storage: {str(e)}")
    
    def url(self, path: str) -> str:
        """Generate URL for local file."""
        media_url = settings.MEDIA_URL.rstrip('/')
        return f"{media_url}/{path}"
    
    def exists(self, path: str) -> bool:
        """Check if file exists locally."""
        full_path = self.storage_root / path
        return full_path.exists()
    
    def size(self, path: str) -> Optional[int]:
        """Get file size from local filesystem."""
        try:
            full_path = self.storage_root / path
            if full_path.exists():
                return full_path.stat().st_size
            return None
        except Exception:
            return None
