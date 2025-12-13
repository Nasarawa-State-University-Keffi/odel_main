"""
Storage module for pluggable file storage backends.
Provides abstraction layer for storing files in different backends (local, S3, Cloudinary, etc.)
"""

from .router import get_storage_engine

__all__ = ['get_storage_engine']
