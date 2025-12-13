"""
Cloudinary storage engine.
Stores files in Cloudinary cloud storage service.
"""

from typing import BinaryIO, Optional
from django.conf import settings

from .base import BaseStorageEngine, StorageException


class CloudinaryStorageEngine(BaseStorageEngine):
    """
    Cloudinary storage implementation.
    
    Requires cloudinary package and credentials configured in settings:
    - CLOUDINARY_CLOUD_NAME
    - CLOUDINARY_API_KEY
    - CLOUDINARY_API_SECRET
    """
    
    def __init__(self):
        """Initialize Cloudinary with credentials from Django settings."""
        try:
            import cloudinary
            import cloudinary.uploader
            import cloudinary.api
            
            self.cloudinary = cloudinary
            self.uploader = cloudinary.uploader
            self.api = cloudinary.api
            
            # Load credentials from Django settings
            cloud_name = settings.CLOUDINARY_CLOUD_NAME
            api_key = settings.CLOUDINARY_API_KEY
            api_secret = settings.CLOUDINARY_API_SECRET
            
            if not all([cloud_name, api_key, api_secret]):
                raise StorageException(
                    "Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, "
                    "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file"
                )
            
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            
        except ImportError:
            raise StorageException(
                "cloudinary package is required for Cloudinary storage. "
                "Install with: pip install cloudinary"
            )
    
    def save(self, file_obj: BinaryIO, path: str) -> str:
        """
        Upload file to Cloudinary.
        
        Args:
            file_obj: File to upload
            path: Public ID for the file in Cloudinary
            
        Returns:
            str: The public ID where file was saved
        """
        try:
            # Extract public_id from path (remove extension)
            public_id = path.rsplit('.', 1)[0] if '.' in path else path
            
            # Determine resource type based on file
            resource_type = 'auto'  # Let Cloudinary auto-detect
            
            # Upload to Cloudinary
            result = self.uploader.upload(
                file_obj,
                public_id=public_id,
                resource_type=resource_type,
                overwrite=True
            )
            
            # Return the public_id (this is our "path")
            return result['public_id']
            
        except Exception as e:
            raise StorageException(f"Failed to upload to Cloudinary: {str(e)}")
    
    def delete(self, path: str) -> bool:
        """Delete file from Cloudinary."""
        try:
            # Extract public_id from path
            public_id = path.rsplit('.', 1)[0] if '.' in path else path
            
            # Try different resource types
            for resource_type in ['image', 'video', 'raw']:
                try:
                    self.uploader.destroy(public_id, resource_type=resource_type)
                    return True
                except Exception:
                    continue
            
            return False
            
        except Exception as e:
            raise StorageException(f"Failed to delete from Cloudinary: {str(e)}")
    
    def url(self, path: str) -> str:
        """
        Generate public URL for Cloudinary resource.
        
        Returns optimized URL with transformations if needed.
        """
        try:
            # Extract public_id from path
            public_id = path.rsplit('.', 1)[0] if '.' in path else path
            
            # Generate URL using Cloudinary's utility
            from cloudinary import CloudinaryImage
            return CloudinaryImage(public_id).build_url()
            
        except Exception:
            # Fallback to manual URL construction
            cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME')
            return f"https://res.cloudinary.com/{cloud_name}/image/upload/{path}"
    
    def exists(self, path: str) -> bool:
        """Check if resource exists in Cloudinary."""
        try:
            # Extract public_id from path
            public_id = path.rsplit('.', 1)[0] if '.' in path else path
            
            # Try to get resource info
            for resource_type in ['image', 'video', 'raw']:
                try:
                    self.api.resource(public_id, resource_type=resource_type)
                    return True
                except Exception:
                    continue
            
            return False
            
        except Exception:
            return False
    
    def size(self, path: str) -> Optional[int]:
        """Get resource size from Cloudinary."""
        try:
            # Extract public_id from path
            public_id = path.rsplit('.', 1)[0] if '.' in path else path
            
            # Try to get resource info
            for resource_type in ['image', 'video', 'raw']:
                try:
                    result = self.api.resource(public_id, resource_type=resource_type)
                    return result.get('bytes')
                except Exception:
                    continue
            
            return None
            
        except Exception:
            return None
