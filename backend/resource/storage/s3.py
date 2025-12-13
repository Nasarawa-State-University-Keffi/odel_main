"""
Amazon S3 storage engine.
Stores files in AWS S3 buckets.
"""

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
        """Initialize S3 client with credentials from Django settings."""
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            self.ClientError = ClientError
            
            # Load credentials from Django settings
            aws_access_key = settings.AWS_ACCESS_KEY_ID
            aws_secret_key = settings.AWS_SECRET_ACCESS_KEY
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            aws_region = settings.AWS_S3_REGION_NAME
            
            if not all([aws_access_key, aws_secret_key, self.bucket_name]):
                raise StorageException(
                    "AWS credentials not configured. Set AWS_ACCESS_KEY_ID, "
                    "AWS_SECRET_ACCESS_KEY, and AWS_STORAGE_BUCKET_NAME in .env file"
                )
            
            # Initialize S3 client
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=aws_region
            )
            
            # Configuration
            self.acl = os.environ.get('AWS_DEFAULT_ACL', 'public-read')
            self.custom_domain = os.environ.get('AWS_S3_CUSTOM_DOMAIN')
            
        except ImportError:
            raise StorageException("boto3 package is required for S3 storage. Install with: pip install boto3")
    
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
            # Read file content
            if hasattr(file_obj, 'chunks'):
                content = b''.join(chunk for chunk in file_obj.chunks())
            else:
                content = file_obj.read()
            
            # Upload to S3
            extra_args = {'ACL': self.acl}
            
            # Set content type if available
            if hasattr(file_obj, 'content_type'):
                extra_args['ContentType'] = file_obj.content_type
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=path,
                Body=content,
                **extra_args
            )
            
            return path
            
        except self.ClientError as e:
            raise StorageException(f"Failed to upload to S3: {str(e)}")
        except Exception as e:
            raise StorageException(f"Unexpected error uploading to S3: {str(e)}")
    
    def delete(self, path: str) -> bool:
        """Delete file from S3 bucket."""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=path
            )
            return True
            
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
            region = getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
            return f"https://{self.bucket_name}.s3.{region}.amazonaws.com/{path}"
    
    def exists(self, path: str) -> bool:
        """Check if object exists in S3 bucket."""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=path)
            return True
        except self.ClientError:
            return False
    
    def size(self, path: str) -> Optional[int]:
        """Get object size from S3."""
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=path)
            return response.get('ContentLength')
        except self.ClientError:
            return None
