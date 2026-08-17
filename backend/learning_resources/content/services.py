"""
Service layer for LMS learning-content management.
Corrected and production-ready version.
"""

import hashlib
import uuid
import mimetypes
from typing import Optional, BinaryIO
from django.core.files.uploadedfile import UploadedFile
from django.contrib.auth.models import User
from django.db import transaction

from portal_auth.models import PortalUser
from learning_resources.storage import get_storage_engine
from learning_resources.storage.base import StorageException
from .models import CourseModule, LearningContent, ContentAccessLog, StorageSettings
from courses.models import CourseCache


# ==========================================================
# MAIN UPLOAD LOGIC
# ==========================================================

def upload_learning_content(
    file_obj: UploadedFile,
    course: CourseCache,
    content_type: str,
    user: PortalUser,
    title: Optional[str] = None,
    description: str = '',
    storage_backend: Optional[str] = None,
    module: Optional[CourseModule] = None,
    order: int = 0,
    is_published: bool = True,
) -> LearningContent:
    """
    Upload learning content (Moodle-style).
    Fixed version: deduplication handled at storage level ONLY.
    """

    # Validate content type
    valid_types = ['note', 'video', 'resource', 'assignment']
    if content_type not in valid_types:
        raise ValueError(f"Invalid content_type. Must be one of: {', '.join(valid_types)}")

    if module and module.course_id != course.id:
        raise ValueError("The selected module belongs to a different course.")

    # Use original filename as title if none provided
    if not title:
        title = file_obj.name

    # Calculate file hash
    content_hash = _calculate_file_hash(file_obj)

    # Determine storage backend
    if storage_backend is None:
        storage_backend = _get_configured_backend()

    storage = get_storage_engine(storage_backend)

    # Generate persistent path
    storage_path = _generate_storage_path(
        course_id=str(course.id),
        content_type=content_type,
        filename=file_obj.name
    )

    # Upload file
    try:
        file_obj.seek(0)
        stored_path = storage.save(file_obj, storage_path)

        # Determine file size
        file_size = getattr(file_obj, "size", None)
        if file_size is None and hasattr(storage, "size"):
            file_size = storage.size(stored_path)

        # Detect MIME type
        mime_type = getattr(file_obj, "content_type", None) or _guess_mime_type(file_obj.name)

        # Create database record
        with transaction.atomic():
            content = LearningContent.objects.create(
                component='learning_content',
                content_type=content_type,
                course=course,
                module=module,
                order=order,
                title=title,
                description=description,
                storage_path=stored_path,
                original_filename=file_obj.name,
                file_size=file_size,
                mime_type=mime_type,
                storage_backend=storage_backend,
                content_hash=content_hash,
                uploaded_by=user,
                is_published=is_published,
            )

        return content

    except Exception as e:
        # Attempt cleanup if DB fails
        try:
            storage.delete(storage_path)
        except Exception:
            pass

        raise StorageException(f"Failed to upload content: {str(e)}")


# ==========================================================
# YOUTUBE VIDEO STORAGE
# ==========================================================

def upload_youtube_video(
    video_url: str,
    course: CourseCache,
    user: PortalUser,
    title: str,
    description: str = '',
    module: Optional[CourseModule] = None,
    order: int = 0,
    is_published: bool = True,
) -> LearningContent:
    """
    Register YouTube video as content.
    """

    if module and module.course_id != course.id:
        raise ValueError("The selected module belongs to a different course.")

    storage = get_storage_engine("youtube")

    try:
        video_id = storage.save(None, video_url)

        return LearningContent.objects.create(
            component='learning_content',
            content_type='video',
            course=course,
            module=module,
            order=order,
            title=title,
            description=description,
            storage_path=video_id,
            original_filename=f"{video_id}.mp4",
            storage_backend='youtube',
            content_hash=video_id,
            uploaded_by=user,
            is_published=is_published,
        )

    except Exception as e:
        raise StorageException(f"Failed to add YouTube video: {str(e)}")


# ==========================================================
# CONTENT DELETION
# ==========================================================

def delete_learning_content(content_id: uuid.UUID) -> bool:
    """
    Delete content and remove file from storage backend.
    """

    content = LearningContent.objects.get(id=content_id)
    content.delete()    # model handles storage cleanup
    return True


# ==========================================================
# RETRIEVAL
# ==========================================================

def get_course_contents(
    course: CourseCache,
    content_type: Optional[str] = None,
    published_only: bool = True
):
    """
    Fetch all files for a course.
    """

    qs = LearningContent.objects.filter(course=course)

    if content_type:
        qs = qs.filter(content_type=content_type)

    if published_only:
        qs = qs.filter(is_published=True)

    return qs.select_related("course", "uploaded_by")


# ==========================================================
# ACCESS LOGGING
# ==========================================================

def log_content_access(
    content: LearningContent,
    user: Optional[PortalUser],
    action: str,
    ip_address: Optional[str] = None,
    user_agent: str = ''
) -> ContentAccessLog:
    """
    Log a file view/download event.
    """

    log_entry = ContentAccessLog.objects.create(
        content=content,
        user=user,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if action == "download":
        content.increment_downloads()

    return log_entry


# ==========================================================
# STORAGE SETTINGS
# ==========================================================

def update_storage_settings(
    backend: str,
    **credentials
) -> StorageSettings:
    """
    Update active backend config.
    """

    settings, created = StorageSettings.objects.get_or_create(
        backend=backend,
        defaults={'is_active': True}
    )

    for key, value in credentials.items():
        if hasattr(settings, key):
            setattr(settings, key, value)

    settings.is_active = True
    settings.save()

    from django.core.cache import cache
    cache.delete(f"storage_engine_{backend}")

    return settings


# ==========================================================
# STORAGE MIGRATION
# ==========================================================

def migrate_content_to_backend(
    content: LearningContent,
    target_backend: str
) -> LearningContent:
    """
    Move file from one backend to another.
    Currently only supports local → other.
    """

    if content.storage_backend == target_backend:
        return content

    source = get_storage_engine(content.storage_backend)
    target = get_storage_engine(target_backend)

    try:
        if content.storage_backend == "local":
            from django.conf import settings
            from pathlib import Path

            file_path = Path(settings.MEDIA_ROOT) / content.storage_path

            with open(file_path, "rb") as f:
                new_path = target.save(f, content.storage_path)
        else:
            raise StorageException(
                "Migration from remote backends not yet supported."
            )

        source.delete(content.storage_path)

        content.storage_backend = target_backend
        content.storage_path = new_path
        content.save(update_fields=["storage_backend", "storage_path"])

        return content

    except Exception as e:
        raise StorageException(f"Failed to migrate content: {str(e)}")


# ==========================================================
# PRIVATE HELPERS
# ==========================================================

def _calculate_file_hash(file_obj: BinaryIO) -> str:
    """SHA256 hash for deduplication."""
    hasher = hashlib.sha256()
    file_obj.seek(0)

    if hasattr(file_obj, "chunks"):
        for chunk in file_obj.chunks():
            hasher.update(chunk)
    else:
        hasher.update(file_obj.read())

    file_obj.seek(0)
    return hasher.hexdigest()


def _generate_storage_path(course_id: str, content_type: str, filename: str) -> str:
    """UUID-based path: courses/<course>/<type>/<uuid>.ext"""

    ext = ''
    if '.' in filename:
        ext = '.' + filename.rsplit('.', 1)[1].lower()

    return f"courses/{course_id}/{content_type}/{uuid.uuid4()}{ext}"


def _guess_mime_type(filename: str) -> str:
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


def _get_configured_backend() -> str:
    """Return the active storage backend."""
    settings = StorageSettings.objects.filter(is_active=True).first()
    return settings.backend if settings else "local"
