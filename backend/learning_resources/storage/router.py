"""
Learning-resource storage router - selects a backend based on configuration.
Similar to Moodle's file storage API routing system.
"""

from typing import Optional
from django.core.cache import cache

from .base import BaseStorageEngine, StorageException
from .local import LocalStorageEngine
from .s3 import S3StorageEngine
from .cloudinary import CloudinaryStorageEngine
from .youtube import YouTubeStorageEngine


# Storage engine registry
STORAGE_ENGINES = {
    'local': LocalStorageEngine,
    's3': S3StorageEngine,
    'cloudinary': CloudinaryStorageEngine,
    'youtube': YouTubeStorageEngine,
}


def get_storage_engine(backend: Optional[str] = None) -> BaseStorageEngine:
    """
    Get storage engine instance based on configuration.
    
    This is the main entry point for getting a storage backend.
    Similar to Moodle's get_file_storage() function.
    
    Args:
        backend: Storage backend name ('local', 's3', 'cloudinary', 'youtube')
                If None, uses the configured default from StorageSettings
    
    Returns:
        BaseStorageEngine: Initialized storage engine instance
        
    Raises:
        StorageException: If backend is not supported or initialization fails
        
    Example:
        >>> storage = get_storage_engine('s3')
        >>> storage.save(file_obj, 'courses/123/notes/lecture1.pdf')
    """
    # Get backend from parameter or database settings
    if backend is None:
        backend = _get_configured_backend()
    
    backend = backend.lower()
    
    # Check if backend is supported
    if backend not in STORAGE_ENGINES:
        supported = ', '.join(STORAGE_ENGINES.keys())
        raise StorageException(
            f"Storage backend '{backend}' is not supported. "
            f"Supported backends: {supported}"
        )
    
    # Get cached instance or create new one
    cache_key = f'storage_engine_{backend}'
    engine = cache.get(cache_key)
    
    if engine is None:
        try:
            engine_class = STORAGE_ENGINES[backend]
            engine = engine_class()
            
            # Cache for 1 hour
            cache.set(cache_key, engine, 3600)
            
        except Exception as e:
            raise StorageException(f"Failed to initialize {backend} storage engine: {str(e)}")
    
    return engine


def _get_configured_backend() -> str:
    """
    Get the configured storage backend from database settings.
    
    Returns:
        str: Backend name (defaults to 'local' if not configured)
    """
    try:
        # Try to import StorageSettings model
        from learning_resources.content.models import StorageSettings
        
        # Get active settings
        settings = StorageSettings.objects.filter(is_active=True).first()
        
        if settings:
            return settings.backend
        
    except Exception:
        # Model doesn't exist yet or other error
        pass
    
    # Default to local storage
    return 'local'


def register_storage_engine(name: str, engine_class: type):
    """
    Register a custom storage engine.
    
    This allows adding new storage backends without modifying the core code.
    
    Args:
        name: Backend name (e.g., 'dropbox', 'google_drive')
        engine_class: Storage engine class (must inherit from BaseStorageEngine)
        
    Raises:
        ValueError: If engine_class doesn't inherit from BaseStorageEngine
        
    Example:
        >>> from learning_resources.storage import register_storage_engine
        >>> from myapp.storage import DropboxStorageEngine
        >>> register_storage_engine('dropbox', DropboxStorageEngine)
    """
    if not issubclass(engine_class, BaseStorageEngine):
        raise ValueError(
            f"Storage engine must inherit from BaseStorageEngine. "
            f"{engine_class.__name__} does not."
        )
    
    STORAGE_ENGINES[name.lower()] = engine_class
    
    # Clear cache to force re-initialization
    cache_key = f'storage_engine_{name.lower()}'
    cache.delete(cache_key)


def get_available_backends() -> list:
    """
    Get list of available storage backends.
    
    Returns:
        list: List of backend names
    """
    return list(STORAGE_ENGINES.keys())
