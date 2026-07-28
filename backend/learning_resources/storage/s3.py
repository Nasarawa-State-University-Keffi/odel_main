"""
Amazon S3 learning-resource storage engine.
Stores files in AWS S3 buckets.
"""

import os
from typing import BinaryIO, Optional
from django.conf import settings

from .base import BaseStorageEngine, StorageException


class S3StorageEngine(BaseStorageEngine):
    """
    AWS S3 storage implementation.
    
    Requires boto3 package and AWS credentials configured in settings:
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
    - AWS_STORAGE_BUCKET_NAME
    - AWS_S3_REGION_NAME (optional)
    """
    
    def __init__(self):
        """Initialize S3 configuration from Django settings."""
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            # Don't store boto3 objects (they can't be pickled for caching)
            # Store credentials and configuration instead
            self.aws_access_key = settings.AWS_ACCESS_KEY_ID
            self.aws_secret_key = settings.AWS_SECRET_ACCESS_KEY
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            self.aws_region = settings.AWS_S3_REGION_NAME
            
            if not all([self.aws_access_key, self.aws_secret_key, self.bucket_name]):
                raise StorageException(
                    "AWS credentials not configured. Set AWS_ACCESS_KEY_ID, "
                    "AWS_SECRET_ACCESS_KEY, and AWS_STORAGE_BUCKET_NAME in .env file"
                )
            
            # Configuration
            # Default to no ACL (modern S3 buckets often have ACLs disabled)
            # Set AWS_DEFAULT_ACL='public-read' in .env only if your bucket supports ACLs
            self.acl = os.environ.get('AWS_DEFAULT_ACL', 'none')
            self.custom_domain = os.environ.get('AWS_S3_CUSTOM_DOMAIN')
            
        except ImportError:
            raise StorageException("boto3 package is required for S3 storage. Install with: pip install boto3")
    
    def _get_client(self):
        """Get S3 client (create on demand to avoid pickling issues)."""
        import boto3
        return boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.aws_region
        )
    
    def save(self, file_obj: BinaryIO, path: str) -> str:
        """
        Upload file to S3 bucket.
        
        Args:
            file_obj: File to upload
            path: S3 key (path) for the file
            
        Returns:
            str: The S3 key where file was saved
        """
        try:
            from botocore.exceptions import ClientError
            
            # Read file content
            if hasattr(file_obj, 'chunks'):
                content = b''.join(chunk for chunk in file_obj.chunks())
            else:
                content = file_obj.read()
            
            # Upload to S3
            extra_args = {}
            
            # Only add ACL if bucket supports it (skip if ACLs are disabled)
            # Modern S3 buckets often have ACLs disabled for security
            if self.acl and self.acl.lower() != 'none':
                try:
                    extra_args['ACL'] = self.acl
                except Exception:
                    pass  # Ignore ACL errors, bucket may have ACLs disabled
            
            # Set content type if available
            if hasattr(file_obj, 'content_type'):
                extra_args['ContentType'] = file_obj.content_type
            
            s3_client = self._get_client()
            s3_client.put_object(
                Bucket=self.bucket_name,
                Key=path,
                Body=content,
                **extra_args
            )
            
            return path
            
        except ClientError as e:
            raise StorageException(f"Failed to upload to S3: {str(e)}")
    def delete(self, path: str) -> bool:
        """Delete file from S3 bucket."""
        try:
            from botocore.exceptions import ClientError
            
            s3_client = self._get_client()
            s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=path
            )
            return True
            
        except ClientError as e:
            raise StorageException(f"Failed to delete from S3: {str(e)}")
            
        except self.ClientError as e:
            raise StorageException(f"Failed to delete from S3: {str(e)}")
    
    def url(self, path: str) -> str:
        """
        Generate public URL for S3 object.
        
        Uses custom domain if configured, otherwise generates standard S3 URL.
        """
        if self.custom_domain:
            return f"https://{self.custom_domain}/{path}"
        else:
            return f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{path}"
    
    def exists(self, path: str) -> bool:
        """Check if object exists in S3 bucket."""
        try:
            from botocore.exceptions import ClientError
            
            s3_client = self._get_client()
            s3_client.head_object(Bucket=self.bucket_name, Key=path)
            return True
        except ClientError:
            return False
    
    def size(self, path: str) -> Optional[int]:
        """Get object size from S3."""
        try:
            from botocore.exceptions import ClientError
            
            s3_client = self._get_client()
            response = s3_client.head_object(Bucket=self.bucket_name, Key=path)
            return response.get('ContentLength')
        except ClientError:
            return Noneself.s3_client.head_object(Bucket=self.bucket_name, Key=path)
            return response.get('ContentLength')
        except self.ClientError:
            return None
