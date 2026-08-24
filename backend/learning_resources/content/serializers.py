"""
Serializers for the LMS learning-content API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field

from .models import CourseModule, LearningContent, StorageSettings, ContentAccessLog
from courses.models import CourseCache


def resolve_course_identifier(value):
    """Resolve a course external ID first, then its internal database ID."""
    try:
        course = CourseCache.objects.filter(course_external_id=value).first()
    except (TypeError, ValueError):
        course = None
    if course:
        return course

    try:
        return CourseCache.objects.filter(pk=value).first()
    except (TypeError, ValueError):
        return None


# ==========================================================
# LEARNING CONTENT SERIALIZER
# ==========================================================

class LearningContentSerializer(serializers.ModelSerializer):
    """Serializer for learning content metadata."""
    
    url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    uploaded_by_external_id = serializers.CharField(source='uploaded_by.external_id', read_only=True)
    course_title = serializers.CharField(source='course.course_title', read_only=True)
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    file_extension = serializers.CharField(read_only=True)
    is_video = serializers.BooleanField(read_only=True)
    is_document = serializers.BooleanField(read_only=True)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_url(self, obj) -> str:
        raw_url = obj.url
        if not raw_url:
            return ""
        if raw_url.startswith(('http://', 'https://')):
            return raw_url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(raw_url)
        return raw_url

    class Meta:
        model = LearningContent
        fields = [
            # identity
            'id', 'component', 'course_external_id', 'course_title',
            'module', 'module_title', 'order',

            # metadata
            'title', 'text_content', 'external_url', 'original_filename', 'file_size',
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
            'component',
            'original_filename',
            'file_size',
            'mime_type',
            'storage_backend',
            'uploaded_by',
            'download_count',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        module = attrs.get('module', getattr(self.instance, 'module', None))
        course = getattr(self.instance, 'course', None)
        if module and course and module.course_id != course.id:
            raise serializers.ValidationError({
                'module': 'The selected module belongs to a different course.'
            })
        return attrs


# ==========================================================
# COURSE MODULE SERIALIZERS
# ==========================================================

class CourseModuleSerializer(serializers.ModelSerializer):
    course_id = serializers.CharField(write_only=True)
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)
    course_title = serializers.CharField(source='course.course_title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    content_count = serializers.SerializerMethodField()
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = CourseModule
        fields = [
            'id', 'course_id', 'course_external_id', 'course_title',
            'title', 'description', 'order', 'is_published',
            'available_from', 'available_until', 'is_available',
            'content_count', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
        ]

    def get_content_count(self, obj) -> int:
        return obj.contents.count()

    def validate_course_id(self, value):
        course = resolve_course_identifier(value)
        if not course:
            raise serializers.ValidationError(
                'Course not found. Provide the course external ID or internal ID.'
            )
        return course

    def validate(self, attrs):
        course = attrs.get('course_id')
        if (
            self.instance
            and course
            and course.id != self.instance.course_id
        ):
            raise serializers.ValidationError({
                'course_id': 'A module cannot be moved to another course.'
            })

        available_from = attrs.get(
            'available_from',
            getattr(self.instance, 'available_from', None)
        )
        available_until = attrs.get(
            'available_until',
            getattr(self.instance, 'available_until', None)
        )
        if available_from and available_until and available_until <= available_from:
            raise serializers.ValidationError({
                'available_until': 'Must be later than available_from.'
            })
        return attrs

    def create(self, validated_data):
        validated_data['course'] = validated_data.pop('course_id')
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('course_id', None)
        return super().update(instance, validated_data)


class CourseModuleDetailSerializer(CourseModuleSerializer):
    contents = serializers.SerializerMethodField()

    class Meta(CourseModuleSerializer.Meta):
        fields = CourseModuleSerializer.Meta.fields + ['contents']

    @extend_schema_field(LearningContentSerializer(many=True))
    def get_contents(self, obj) -> list:
        contents = obj.contents.select_related(
            'course', 'module', 'uploaded_by'
        ).order_by('order', 'created_at')
        return LearningContentSerializer(contents, many=True, context=self.context).data


class StudentCourseModuleSerializer(serializers.ModelSerializer):
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)
    course_title = serializers.CharField(source='course.course_title', read_only=True)
    contents = serializers.SerializerMethodField()

    class Meta:
        model = CourseModule
        fields = [
            'id', 'course_external_id', 'course_title', 'title',
            'description', 'order', 'available_from', 'available_until',
            'contents',
        ]

    @extend_schema_field(LearningContentSerializer(many=True))
    def get_contents(self, obj) -> list:
        contents = obj.contents.all()
        request = self.context.get('request')
        if not request or not request.user.is_staff:
            contents = contents.filter(is_published=True)
        contents = contents.select_related(
            'course', 'module', 'uploaded_by'
        ).order_by('order', 'created_at')
        return LearningContentSerializer(contents, many=True, context=self.context).data


class UnifiedLearningContentSerializer(serializers.Serializer):
    """Create one lesson with any combination of text, file, and link content."""

    course_id = serializers.CharField()
    module_id = serializers.PrimaryKeyRelatedField(
        source='module', queryset=CourseModule.objects.all(), required=False, allow_null=True
    )
    title = serializers.CharField(max_length=512)
    text_content = serializers.CharField(required=False, allow_blank=True, default='')
    url = serializers.URLField(required=False, allow_blank=True)
    file = serializers.FileField(required=False)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    is_published = serializers.BooleanField(required=False, default=True)
    storage_backend = serializers.ChoiceField(
        choices=['local', 's3', 'cloudinary'], required=False, allow_blank=True
    )

    def validate_course_id(self, value):
        if not resolve_course_identifier(value):
            raise serializers.ValidationError('Course not found. Provide the course external ID or internal ID.')
        return value

    def validate(self, attrs):
        course = resolve_course_identifier(attrs['course_id'])
        module = attrs.get('module')
        if module and module.course_id != course.id:
            raise serializers.ValidationError({'module_id': 'The selected module belongs to a different course.'})
        if not attrs.get('file') and not attrs.get('url') and not attrs.get('text_content', '').strip():
            raise serializers.ValidationError('Provide at least one of file, url, or text_content.')
        if attrs.get('url') and ('youtube.com' in attrs['url'] or 'youtu.be' in attrs['url']):
            YouTubeVideoSerializer().validate_video_url(attrs['url'])
        return attrs


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
    title = serializers.CharField(max_length=512, required=False, allow_blank=True)
    module_id = serializers.PrimaryKeyRelatedField(
        source='module',
        queryset=CourseModule.objects.all(),
        required=False,
        allow_null=True,
    )
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    is_published = serializers.BooleanField(required=False, default=True)
    
    storage_backend = serializers.ChoiceField(
        choices=['local', 's3', 'cloudinary', 'youtube'],
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Storage backend (optional - uses database default if not specified)"
    )

    def validate_course_id(self, value):
        """Validate a course external ID or internal database ID."""
        if not resolve_course_identifier(value):
            raise serializers.ValidationError(
                'Course not found. Provide the course external ID or internal ID.'
            )
        return value

    def validate(self, attrs):
        """
        Optional: Prevent uploading video files via wrong backend.
        e.g., forcing YouTube uploads to use YouTube serializer.
        """

        course = resolve_course_identifier(attrs.get('course_id'))
        module = attrs.get('module')
        if module and course and module.course_id != course.id:
            raise serializers.ValidationError({
                'module_id': 'The selected module belongs to a different course.'
            })

        # If backend is not specified, allow default logic
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
    module_id = serializers.PrimaryKeyRelatedField(
        source='module',
        queryset=CourseModule.objects.all(),
        required=False,
        allow_null=True,
    )
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    is_published = serializers.BooleanField(required=False, default=True)

    def validate_course_id(self, value):
        """Validate a course external ID or internal database ID."""
        if not resolve_course_identifier(value):
            raise serializers.ValidationError(
                'Course not found. Provide the course external ID or internal ID.'
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

    def validate(self, attrs):
        course = resolve_course_identifier(attrs.get('course_id'))
        module = attrs.get('module')
        if module and course and module.course_id != course.id:
            raise serializers.ValidationError({
                'module_id': 'The selected module belongs to a different course.'
            })
        return attrs


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
    by_backend = serializers.DictField()
    most_downloaded = serializers.ListField()
