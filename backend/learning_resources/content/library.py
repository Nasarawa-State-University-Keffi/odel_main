"""Course-independent library API and administrator/library-staff management."""

from urllib.parse import urlparse

from django.conf import settings
from django.http import Http404
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError, APIException
from rest_framework.response import Response

from courses.models import CourseCache
from courses.serializers import CourseCacheSerializer
from .access import is_resource_admin
from .models import LibraryResource, ResourceCategory
from .library_storage import open_remote_file, remove_file, save_resource


def is_library_manager(user):
    roles = {str(role).strip().upper() for role in user.roles}
    return is_resource_admin(user) or bool(user.is_staff and "LIBRARY" in roles)


def is_library_reader(user):
    roles = {str(role).upper() for role in user.roles}
    return bool(
        user.is_staff
        or is_library_manager(user)
        or roles & {'STUDENT', 'PORTAL_STUDENTS'}
    )


def visible_resources(user):
    queryset = LibraryResource.objects.select_related(
        'category', 'course', 'created_by'
    )
    if not is_library_reader(user):
        return queryset.none()
    if is_library_manager(user):
        return queryset
    return queryset.filter(is_published=True)


class LibraryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return is_library_reader(user)
        return is_library_manager(user)


class ResourceCategorySerializer(serializers.ModelSerializer):
    resource_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ResourceCategory
        fields = ['id', 'name', 'resource_count']

    def validate_name(self, value):
        value = value.strip()
        existing = ResourceCategory.objects.filter(name__iexact=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if not value or existing.exists():
            raise serializers.ValidationError('Enter a unique category name.')
        return value


class LibraryResourceSerializer(serializers.ModelSerializer):
    description = serializers.CharField(
        max_length=4000, required=False, allow_blank=True
    )
    file = serializers.FileField(write_only=True, required=False)
    category_name = serializers.CharField(
        source='category.name', read_only=True, allow_null=True
    )
    course_code = serializers.CharField(
        source='course.course_code', read_only=True, allow_null=True
    )
    course_title = serializers.CharField(
        source='course.course_title', read_only=True, allow_null=True
    )
    created_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = LibraryResource
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'tags',
            'course',
            'course_code',
            'course_title',
            'external_url',
            'file',
            'file_url',
            'resource_type',
            'original_filename',
            'mime_type',
            'file_size',
            'is_published',
            'created_by',
            'created_by_name',
            'can_manage',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'resource_type',
            'original_filename',
            'mime_type',
            'file_size',
            'created_by',
            'created_at',
            'updated_at',
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else 'Former staff member'

    def get_file_url(self, obj):
        if not obj.storage_path:
            return None
        return self.context['request'].build_absolute_uri(
            reverse('library-resource-file', args=[obj.pk])
        )

    def get_can_manage(self, obj):
        user = self.context['request'].user
        return is_library_manager(user)

    def validate_file(self, value):
        maximum = settings.RESOURCE_LIBRARY_MAX_UPLOAD_SIZE_BYTES
        if value.size > maximum:
            raise serializers.ValidationError(
                f'Files must be {maximum / (1024 * 1024):g} MB or smaller.'
            )
        return value

    def validate_tags(self, value):
        if not isinstance(value, list) or len(value) > 10:
            raise serializers.ValidationError('Use up to 10 tags.')
        tags = []
        for tag in value:
            if not isinstance(tag, str) or not tag.strip() or len(tag.strip()) > 40:
                raise serializers.ValidationError(
                    'Each tag must contain 1 to 40 characters.'
                )
            tag = tag.strip().lower()
            if tag not in tags:
                tags.append(tag)
        return tags

    def validate_external_url(self, value):
        if value and not value.startswith(('https://', 'http://')):
            raise serializers.ValidationError('Use an http or https URL.')
        return value

    def validate(self, attrs):
        file_exists = bool(self.instance and self.instance.storage_path)
        url = attrs.get('external_url', getattr(self.instance, 'external_url', ''))
        if not attrs.get('file') and not file_exists and not url:
            raise serializers.ValidationError('Attach a file or add an external link.')
        if not attrs.get('file') and not file_exists:
            host = (urlparse(url).hostname or '').lower()
            attrs['resource_type'] = (
                'video'
                if host
                in ('youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com')
                else 'link'
            )
        return attrs


class ResourceCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceCategorySerializer
    permission_classes = [permissions.IsAuthenticated, LibraryPermission]
    pagination_class = None
    search_fields = ['name']

    def get_queryset(self):
        return ResourceCategory.objects.order_by('name', 'id').annotate(
            resource_count=Count(
                'resources',
                filter=Q(resources__in=visible_resources(self.request.user)),
            )
        )

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            raise ValidationError({'name': 'This category already exists.'})

    def perform_update(self, serializer):
        if not is_library_manager(self.request.user):
            raise PermissionDenied('Only library managers can rename categories.')
        self.perform_create(serializer)

    def perform_destroy(self, instance):
        if not is_library_manager(self.request.user):
            raise PermissionDenied('Only library managers can delete categories.')
        instance.delete()


class LibraryCourseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseCacheSerializer
    permission_classes = [permissions.IsAuthenticated, LibraryPermission]
    search_fields = ['course_code', 'course_title']

    def get_queryset(self):
        queryset = CourseCache.objects.all()
        if is_library_manager(self.request.user):
            return queryset
        return queryset.filter(
            staff_enrollments__staff_external_id=self.request.user.external_id
        ).distinct()


class LibraryResourceViewSet(viewsets.ModelViewSet):
    serializer_class = LibraryResourceSerializer
    permission_classes = [permissions.IsAuthenticated, LibraryPermission]
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'updated_at']

    def get_queryset(self):
        queryset = visible_resources(self.request.user)
        # Filters belong to list requests, so detail/edit URLs stay stable.
        if self.action != 'list':
            return queryset
        params = self.request.query_params
        if params.get('scope') == 'mine':
            queryset = queryset.filter(created_by=self.request.user)
        status = params.get('status')
        if status:
            if status not in ('published', 'draft'):
                raise ValidationError({'status': 'Choose published or draft.'})
            queryset = queryset.filter(is_published=status == 'published')
        if params.get('category'):
            try:
                queryset = queryset.filter(category_id=int(params['category']))
            except ValueError:
                raise ValidationError({'category': 'Choose a valid category.'})
        if params.get('resource_type'):
            if params['resource_type'] not in dict(LibraryResource.RESOURCE_TYPES):
                raise ValidationError(
                    {'resource_type': 'Choose a valid resource type.'}
                )
            queryset = queryset.filter(resource_type=params['resource_type'])
        return queryset

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            from rest_framework.exceptions import NotFound

            raise NotFound('This resource is unavailable or you do not have access.')

    def perform_create(self, serializer):
        serializer.validated_data['created_by'] = self.request.user
        self.save_attachment(serializer)

    def save_attachment(self, serializer):
        try:
            save_resource(serializer)
        except ValidationError:
            raise
        except Exception:
            import logging

            logging.getLogger(__name__).exception('Library resource could not be saved')
            raise APIException('The resource could not be saved. Please try again.')

    def perform_update(self, serializer):
        self.save_attachment(serializer)

    def perform_destroy(self, instance):
        with transaction.atomic():
            resource = get_object_or_404(
                LibraryResource.objects.select_for_update(), pk=instance.pk
            )
            backend, path = resource.storage_backend, resource.storage_path
            resource.delete()
            transaction.on_commit(lambda: remove_file(backend, path))

    @action(detail=True, methods=['get'])
    def file(self, request, pk=None):
        resource = self.get_object()
        if not resource.storage_path:
            from rest_framework.exceptions import NotFound

            raise NotFound('This resource has no file attachment.')
        from learning_resources.media_views import (
            local_media_response,
            resource_file_response,
        )

        download = request.query_params.get('download') == '1'
        if resource.storage_backend == 'local':
            return local_media_response(
                request.user,
                resource.storage_path,
                filename=resource.original_filename,
                force_download=download,
            )
        try:
            file_obj = open_remote_file(resource)
        except Exception:
            raise APIException(
                'The attachment is temporarily unavailable. Please try again.'
            )
        return resource_file_response(file_obj, resource.original_filename, download)
