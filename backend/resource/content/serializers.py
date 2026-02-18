"""
Serializers for learning content API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User

from .models import LearningContent, StorageSettings, ContentAccessLog
from courses.models import CourseCache


# ==========================================================
# LEARNING CONTENT SERIALIZER
# ==========================================================

class LearningContentSerializer(serializers.ModelSerializer):
    """Serializer for learning content metadata."""
    
    url = serializers.ReadOnlyField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    uploaded_by_external_id = serializers.CharField(source='uploaded_by.external_id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    file_extension = serializers.ReadOnlyField()
    is_video = serializers.ReadOnlyField()
    is_document = serializers.ReadOnlyField()

    class Meta:
        model = LearningContent
        fields = [
            # identity
            'id', 'component', 'content_type', 'course', 'course_title',

            # metadata
            'title', 'description', 'original_filename', 'file_size',
            'mime_type', 'storage_backend', 'url', 'file_extension',
            'is_video', 'is_document',

            # ownership
            'uploaded_by', 'uploaded_by_name', 'uploaded_by_external_id',

            # visibility
            'is_published', 'download_count',

            # timestamps
            'created_at', 'updated_at',
        ]

        read_only_fields = [
            'id',
            'storage_path',
            'content_hash',
            'file_size',
            'mime_type',
            'storage_backend',
            'download_count',
            'created_at',
            'updated_at',
        ]


# ===============================================
# UPLOAD SERIALIZER
# ==========================================================

class LearningContentUploadSerializer(serializers.Serializer):
    """
    Serializer for file upload content.
    Used for handling multipart/form-data uploads.
    Accepts either course external_id (e.g., 'CS101') or UUID.
    """
    
    file = serializers.FileField(required=True)
    course_id = serializers.CharField(required=True, help_text="Course external_id (e.g., 'CS101') or UUID")
    content_type = serializers.ChoiceField(
        choices=['note', 'video', 'resource', 'assignment'],
        required=True
    )
    title = serializers.CharField(max_length=512, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    storage_backend = serializers.ChoiceField(
        choices=['local', 's3', 'cloudinary', 'youtube'],
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Storage backend (optional - uses database default if not specified)"
    )

    def validate_course_id(self, value):
        """Validate course_id - accepts either external_id or UUID."""
        # Try to find by external_id first (most common case)
        course = CourseCache.objects.filter(course_external_id=value).first()
        if course:
            return value
        
        # Try to find by UUID
        try:
            import uuid
            uuid_value = uuid.UUID(value)
            course = CourseCache.objects.filter(id=uuid_value).first()
            if course:
                return value
        except (ValueError, AttributeError):
            pass
        
        raise serializers.ValidationError(
            "Course not found. Provide either course external_id (e.g., 'CS101') or UUID."
        )
        
        return value

    def validate(self, attrs):
        """
        Optional: Prevent uploading video files via wrong backend.
        e.g., forcing YouTube uploads to use YouTube serializer.
        """

        backend = attrs.get("storage_backend")
        file: serializers.FileField = attrs.get("file")

        # If backend is not specified, allow default logic
        if not backend:
            return attrs

        # Validate video constraints
        if attrs["content_type"] == "video" and backend != "youtube":
            # Allow local/S3/Cloudinary video if file is actually uploaded
            if file is None:
                raise serializers.ValidationError(
                    "Uploading a video without a file requires using YouTube backend."
                )

        return attrs


# ==========================================================
# YOUTUBE VIDEO SERIALIZER
# ==========================================================

class YouTubeVideoSerializer(serializers.Serializer):
    """
    Serializer for registering YouTube videos as course content.
    Accepts either course external_id (e.g., 'CS101') or UUID.
    """

    video_url = serializers.CharField(max_length=512, required=True)
    course_id = serializers.CharField(required=True, help_text="Course external_id (e.g., 'CS101') or UUID")
    title = serializers.CharField(max_length=512, required=True)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_course_id(self, value):
        """Validate course_id - accepts either external_id or UUID."""
        # Try to find by external_id first
        course = CourseCache.objects.filter(external_id=value).first()
        if course:
            return value
        
        # Try to find by UUID
        try:
            import uuid
            uuid_value = uuid.UUID(value)
            course = CourseCache.objects.filter(id=uuid_value).first()
            if course:
                return value
        except (ValueError, AttributeError):
            pass
        
        raise serializers.ValidationError(
            "Course not found. Provide either course external_id (e.g., 'CS101') or UUID."
        )
        
        return value

    def validate_video_url(self, value):
        """
        Checks for:
        - Full YouTube URL
        - Shortened links
        - Embed links
        - Raw video ID (11 chars)
        """
        import re
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            r'^([a-zA-Z0-9_-]{11})$'
        ]

        for pattern in patterns:
            if re.search(pattern, value):
                return value
        
        raise serializers.ValidationError(
            "Invalid YouTube URL or video ID."
        )


# ==========================================================
# STORAGE SETTINGS SERIALIZER
# ==========================================================

class StorageSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for managing storage backend settings.
    
    NOTE: Credentials are loaded from environment variables (.env file).
    This serializer only manages which backend is active.
    """

    class Meta:
        model = StorageSettings
        fields = [
            'id', 
            'backend', 
            'is_active',
            'created_at', 
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ==========================================================
# ACCESS LOG SERIALIZER
# ==========================================================

class ContentAccessLogSerializer(serializers.ModelSerializer):
    """Serializer for content access tracking."""
    
    content_title = serializers.CharField(source='content.title', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    external_id = serializers.CharField(source='user.external_id', read_only=True)

    class Meta:
        model = ContentAccessLog
        fields = [
            'id', 'content', 'content_title',
            'user', 'full_name', 'external_id',
            'action', 'ip_address', 'user_agent',
            'accessed_at'
        ]
        read_only_fields = ['id', 'accessed_at']


# ==========================================================
# STATISTICS SERIALIZER
# ==========================================================

class ContentStatisticsSerializer(serializers.Serializer):
    """Aggregated content statistics."""
    
    total_contents = serializers.IntegerField()
    total_size = serializers.IntegerField()
    by_type = serializers.DictField()
    by_backend = serializers.DictField()
    most_downloaded = serializers.ListField()
