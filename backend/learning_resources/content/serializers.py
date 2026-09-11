"""
Serializers for the LMS learning-content API.
"""

from rest_framework import serializers
from django.conf import settings
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field

from .models import (
    CourseModule,
    LearningContent,
    StorageSettings,
    ContentAccessLog,
    LessonComment,
    StudyGroup,
    StudyGroupMembership,
    StudyGroupMaterial,
    StudyGroupComment,
    StudyGroupCommentMention,
)
from courses.models import CourseCache
from portal_auth.models import PortalUser


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
            'title', 'content_format', 'text_content', 'external_url', 'original_filename', 'file_size',
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


class LessonCommentSerializer(serializers.ModelSerializer):
    """Serialize one discussion comment and its direct replies."""

    author_name = serializers.SerializerMethodField()
    author_profile_picture = serializers.SerializerMethodField()
    author_is_staff = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = LessonComment
        fields = [
            'id', 'parent', 'body', 'author', 'author_name',
            'author_profile_picture', 'author_is_staff', 'replies',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'author', 'author_name', 'author_profile_picture',
            'author_is_staff', 'replies', 'created_at', 'updated_at',
        ]

    def validate_body(self, value):
        body = value.strip()
        if not body:
            raise serializers.ValidationError('Write a comment before posting.')
        return body

    def validate(self, attrs):
        parent = attrs.get('parent')
        content = self.context.get('content')
        if not parent:
            return attrs
        if content and parent.content_id != content.id:
            raise serializers.ValidationError({
                'parent': 'This comment belongs to a different lesson.'
            })
        if parent.parent_id:
            raise serializers.ValidationError({
                'parent': 'Replies can only be one level deep.'
            })
        return attrs

    def get_author_name(self, obj):
        return obj.author.full_name if obj.author else None

    def get_author_profile_picture(self, obj):
        if not obj.author or not obj.author.profile_picture:
            return None
        return obj.author.profile_picture

    def get_author_is_staff(self, obj):
        return bool(obj.author and obj.author.is_staff)

    def get_replies(self, obj):
        if obj.parent_id:
            return []
        replies = obj.replies.select_related('author').order_by('created_at')
        return LessonCommentSerializer(replies, many=True, context=self.context).data


class StudyGroupMemberSerializer(serializers.ModelSerializer):
    external_id = serializers.CharField(source='user.external_id', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    profile_picture = serializers.URLField(source='user.profile_picture', read_only=True, allow_null=True)

    class Meta:
        model = StudyGroupMembership
        fields = ['external_id', 'full_name', 'profile_picture', 'role']


class StudyGroupSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(source='course.course_external_id', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_title = serializers.CharField(source='course.course_title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    join_code = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = [
            'id', 'course_id', 'course_code', 'course_title', 'session', 'semester',
            'name', 'description', 'is_open', 'member_limit', 'member_count',
            'is_member', 'is_owner', 'join_code', 'members', 'created_by_name', 'created_at', 'updated_at',
        ]

    def _membership(self, obj):
        memberships = getattr(obj, 'current_user_memberships', None)
        if memberships is not None:
            return memberships[0] if memberships else None
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        return StudyGroupMembership.objects.filter(group=obj, user=request.user).first()

    def get_member_count(self, obj):
        return getattr(obj, 'member_count', None) or obj.memberships.count()

    def get_is_member(self, obj):
        return bool(self._membership(obj))

    def get_is_owner(self, obj):
        membership = self._membership(obj)
        return bool(membership and membership.role == 'owner')

    def get_join_code(self, obj):
        return obj.join_code if self._membership(obj) else None

    def get_members(self, obj):
        if not self._membership(obj):
            return []
        memberships = obj.memberships.select_related('user').order_by('joined_at')
        return StudyGroupMemberSerializer(memberships, many=True, context=self.context).data


class StudyGroupCreateSerializer(serializers.Serializer):
    course_id = serializers.CharField()
    session = serializers.CharField(max_length=50)
    semester = serializers.CharField(max_length=100)
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(max_length=1200, required=False, allow_blank=True)
    member_limit = serializers.IntegerField(min_value=2, max_value=100, default=20)

    def validate_course_id(self, value):
        course = resolve_course_identifier(value)
        if not course:
            raise serializers.ValidationError('Course not found.')
        return course

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Give your study group a name.')
        return value


class StudyGroupMaterialSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = StudyGroupMaterial
        fields = [
            'id', 'title', 'description', 'external_url', 'original_filename', 'file_size',
            'mime_type', 'url', 'uploaded_by_name', 'created_at',
        ]

    def get_url(self, obj):
        raw_url = obj.url
        if not raw_url:
            return ''
        if raw_url.startswith(('http://', 'https://')):
            return raw_url
        request = self.context.get('request')
        return request.build_absolute_uri(raw_url) if request else raw_url


class StudyGroupMaterialCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    external_url = serializers.URLField(required=False, allow_blank=True)
    file = serializers.FileField(required=False)

    def validate_file(self, value):
        max_size = settings.STUDY_GROUP_MAX_UPLOAD_SIZE_BYTES
        if value.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            display_limit = f'{max_size_mb:g} MB'
            raise serializers.ValidationError(
                f'Files must be {display_limit} or smaller.'
            )
        return value

    def validate(self, attrs):
        if not attrs.get('file') and not attrs.get('external_url'):
            raise serializers.ValidationError('Attach a file or provide a link to share.')
        return attrs


class StudyGroupCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    replies = serializers.SerializerMethodField()
    mentions = serializers.SerializerMethodField()
    mention_external_ids = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=False,
        write_only=True,
        allow_empty=True,
    )

    class Meta:
        model = StudyGroupComment
        fields = [
            'id', 'material', 'parent', 'body', 'author_name', 'mentions',
            'mention_external_ids', 'replies', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author_name', 'mentions', 'replies', 'created_at', 'updated_at']

    def validate_body(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Write a message before posting.')
        return value

    def validate(self, attrs):
        group = self.context.get('group')
        material = attrs.get('material')
        parent = attrs.get('parent')
        if material and group and material.group_id != group.id:
            raise serializers.ValidationError({'material': 'This material belongs to another group.'})
        if parent and group and parent.group_id != group.id:
            raise serializers.ValidationError({'parent': 'This reply belongs to another group.'})
        if parent and parent.parent_id:
            raise serializers.ValidationError({'parent': 'Replies can only be one level deep.'})
        mention_external_ids = list(dict.fromkeys(attrs.get('mention_external_ids', [])))
        if mention_external_ids and group:
            mentioned_users = PortalUser.objects.filter(external_id__in=mention_external_ids)
            found_ids = set(mentioned_users.values_list('external_id', flat=True))
            unknown_ids = sorted(set(mention_external_ids) - found_ids)
            if unknown_ids:
                raise serializers.ValidationError({'mention_external_ids': 'One or more mentioned students could not be found.'})
            message = attrs.get('body', '').casefold()
            if any(f'@{user.full_name}'.casefold() not in message for user in mentioned_users):
                raise serializers.ValidationError({'mention_external_ids': 'Each mention must appear in the message.'})
            member_ids = set(StudyGroupMembership.objects.filter(
                group=group,
                user__in=mentioned_users,
            ).values_list('user__external_id', flat=True))
            if member_ids != set(mention_external_ids):
                raise serializers.ValidationError({'mention_external_ids': 'You can only mention members of this study group.'})
        attrs['mention_external_ids'] = mention_external_ids
        return attrs

    def create(self, validated_data):
        mention_external_ids = validated_data.pop('mention_external_ids', [])
        comment = StudyGroupComment.objects.create(**validated_data)
        mentioned_users = PortalUser.objects.filter(external_id__in=mention_external_ids)
        StudyGroupCommentMention.objects.bulk_create([
            StudyGroupCommentMention(comment=comment, mentioned_user=user)
            for user in mentioned_users
        ])
        return comment

    def get_mentions(self, obj):
        records = obj.mention_records.select_related('mentioned_user').all()
        return [
            {
                'external_id': record.mentioned_user.external_id,
                'full_name': record.mentioned_user.full_name,
            }
            for record in records
        ]

    def get_replies(self, obj):
        if obj.parent_id:
            return []
        replies = obj.replies.select_related('author').prefetch_related(
            'mention_records__mentioned_user',
        ).order_by('created_at')
        return StudyGroupCommentSerializer(replies, many=True, context=self.context).data


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
