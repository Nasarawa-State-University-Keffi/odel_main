"""
Base storage engine interface.
All storage backends must inherit from BaseStorageEngine and implement required methods.
"""

from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class BaseStorageEngine(ABC):
    """
    Abstract base class for all storage engines.
    
    This provides a unified interface for storing files in different backends.
    Similar to Moodle's stored_file API.
    """
    
    @abstractmethod
    def save(self, file_obj: BinaryIO, path: str) -> str:
        """
        Save a file to storage.
        
        Args:
            file_obj: File-like object to save
            path: Destination path (relative to storage root)
            
        Returns:
            str: The stored file path/key
            
        Raises:
            StorageException: If save operation fails
        """
        pass
    
    @abstractmethod
    def delete(self, path: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            path: Path to file to delete
            
        Returns:
            bool: True if deleted successfully, False otherwise
        """
        pass
    
    @abstractmethod
    def url(self, path: str) -> str:
        """
        Get public URL for accessing the file.
        
        Args:
            path: Path to file
            
        Returns:
            str: Public URL to access the file
        """
        pass
    
    @abstractmethod
    def exists(self, path: str) -> bool:
        """
        Check if file exists in storage.
        
        Args:
            path: Path to check
            
        Returns:
            bool: True if file exists, False otherwise
        """
        pass
    
    @abstractmethod
    def size(self, path: str) -> Optional[int]:
        """
        Get file size in bytes.
        
        Args:
            path: Path to file
            
        Returns:
            int: File size in bytes, or None if file doesn't exist
        """
        pass


class StorageException(Exception):
    """Exception raised when storage operations fail."""
    pass
