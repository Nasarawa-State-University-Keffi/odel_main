"""
YouTube learning-resource storage engine.
For video content, stores metadata and references YouTube video IDs.
Note: This doesn't actually upload to YouTube (requires OAuth), but manages YouTube video references.
"""

from typing import BinaryIO, Optional
from django.conf import settings

from .base import BaseStorageEngine, StorageException


class YouTubeStorageEngine(BaseStorageEngine):
    """
    YouTube reference storage implementation.
    
    This engine doesn't actually upload files to YouTube (that requires OAuth flow).
    Instead, it stores YouTube video IDs and generates embed URLs.
    
    For actual uploads, you would need to:
    1. Implement OAuth2 flow for user authentication
    2. Use Google API Client to upload videos
    3. Store the returned video ID
    
    This implementation assumes video IDs are provided in the path.
    """
    
    def __init__(self):
        """Initialize YouTube engine with API key from Django settings."""
        self.api_key = settings.YOUTUBE_API_KEY
    
    def save(self, file_obj: BinaryIO, path: str) -> str:
        """
        Save YouTube video reference.
        
        Args:
            file_obj: Not used (YouTube upload requires OAuth flow)
            path: YouTube video ID or URL
            
        Returns:
            str: Normalized YouTube video ID
            
        Note:
            For actual uploads, implement OAuth2 flow and use Google API Client.
        """
        # Extract video ID from various YouTube URL formats
        video_id = self._extract_video_id(path)
        
        if not video_id:
            raise StorageException(
                "Invalid YouTube video ID or URL. "
                "Provide either video ID directly or a valid YouTube URL"
            )
        
        # Verify video exists (if API key is configured)
        if self.api_key and not self._verify_video_exists(video_id):
            raise StorageException(f"YouTube video {video_id} does not exist or is not accessible")
        
        return video_id
    
    def delete(self, path: str) -> bool:
        """
        Delete YouTube video reference.
        
        Note: This only removes the reference, not the actual YouTube video.
        Deleting YouTube videos requires OAuth and ownership verification.
        """
        # We can't actually delete YouTube videos without OAuth
        # This only removes the reference from our system
        return True
    
    def url(self, path: str) -> str:
        """
        Generate YouTube embed URL.
        
        Args:
            path: YouTube video ID
            
        Returns:
            str: YouTube embed URL
        """
        video_id = self._extract_video_id(path)
        return f"https://www.youtube.com/embed/{video_id}"
    
    def exists(self, path: str) -> bool:
        """
        Check if YouTube video exists.
        
        Requires YOUTUBE_API_KEY in settings for verification.
        """
        if not self.api_key:
            # Can't verify without API key, assume it exists
            return True
        
        video_id = self._extract_video_id(path)
        return self._verify_video_exists(video_id)
    
    def size(self, path: str) -> Optional[int]:
        """
        Get video size from YouTube.
        
        Note: YouTube API doesn't provide file size directly.
        Returns None as size is not applicable for streaming content.
        """
        return None
    
    def _extract_video_id(self, path: str) -> Optional[str]:
        """
        Extract YouTube video ID from various URL formats.
        
        Supports:
        - youtube.com/watch?v=VIDEO_ID
        - music.youtube.com/watch?v=VIDEO_ID
        - youtu.be/VIDEO_ID
        - youtube.com/embed/VIDEO_ID
        - youtube.com/shorts/VIDEO_ID
        - Direct video ID
        """
        import re
        
        # Pattern for YouTube URLs
        patterns = [
            r'(?:youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
            r'^([a-zA-Z0-9_-]{11})$'  # Direct video ID
        ]
        
        for pattern in patterns:
            match = re.search(pattern, path)
            if match:
                return match.group(1)
        
        return None
    
    def _verify_video_exists(self, video_id: str) -> bool:
        """
        Verify video exists using YouTube Data API v3.
        
        Requires YOUTUBE_API_KEY in settings.
        If key is invalid or quota exceeded, it defaults to True to allow registration.
        """
        try:
            import requests
            
            url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                'part': 'id',
                'id': video_id,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=5)
            
            # If request fails (invalid key, etc), assume video exists
            if response.status_code != 200:
                return True
                
            data = response.json()
            return len(data.get('items', [])) > 0
            
        except Exception:
            # If verification fails completely (e.g. network error), assume video exists
            return True
