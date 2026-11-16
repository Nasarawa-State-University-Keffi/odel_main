"""Serve authorized local resources with safe browser content handling."""

import mimetypes
from pathlib import Path

from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.http import FileResponse, Http404
from django.utils._os import safe_join
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from courses.models import StaffAssignedCourse, StudentRegisteredCourse
from .content.access import is_resource_admin, visible_contents
from .content.models import ForumPost, StudyGroupMaterial


def can_access_media(user, path):
    from .content.library import visible_resources

    if (
        visible_resources(user)
        .filter(storage_backend='local', storage_path=path)
        .exists()
    ):
        return True
    if (
        visible_contents(user)
        .filter(storage_backend='local', storage_path=path)
        .exists()
    ):
        return True
    registrations = StudentRegisteredCourse.objects.filter(student_external=user)
    groups = StudyGroupMaterial.objects.filter(
        storage_backend='local',
        storage_path=path,
        group__memberships__user=user,
    )
    for material in groups.select_related('group'):
        if registrations.filter(
            course=material.group.course,
            session=material.group.session,
            semester=material.group.semester,
        ).exists():
            return True
    posts = ForumPost.objects.filter(storage_backend='local', storage_path=path)
    if posts.filter(forum__memberships__user=user).exists() or (
        is_resource_admin(user) and posts.exists()
    ):
        return True

    # Assignment attachments and submissions share this local storage route.
    from assessment.models import AssignmentContent, AssignmentSubmissionFile

    course_ids = registrations.values('course_id')
    staff_course_ids = StaffAssignedCourse.objects.filter(
        staff_external_id=user.external_id
    ).values('course_id')
    attachments = AssignmentContent.objects.filter(
        storage_backend='local', storage_path=path
    )
    submissions = AssignmentSubmissionFile.objects.filter(
        storage_backend='local', storage_path=path
    )
    if is_resource_admin(user):
        return attachments.exists() or submissions.exists()
    if user.is_staff:
        return (
            attachments.filter(assignment__course_id__in=staff_course_ids).exists()
            or submissions.filter(
                submission__assignment__course_id__in=staff_course_ids
            ).exists()
        )
    return (
        attachments.filter(
            is_published=True,
            assignment__is_published=True,
            assignment__course_id__in=course_ids,
        ).exists()
        or submissions.filter(submission__student_external=user).exists()
    )


def local_media_response(
    user, path, document_root=None, filename=None, force_download=False
):
    document_root = Path(document_root or settings.MEDIA_ROOT).resolve()
    try:
        fullpath = Path(safe_join(document_root, path)).resolve()
        fullpath.relative_to(document_root)
    except (SuspiciousFileOperation, ValueError):
        raise Http404('Invalid media file path.')
    normalized_path = fullpath.relative_to(document_root).as_posix()
    if not fullpath.is_file() or not can_access_media(user, normalized_path):
        raise Http404('Media file not found.')

    return resource_file_response(
        fullpath.open('rb'), filename or fullpath.name, force_download
    )


def resource_file_response(file_obj, filename, force_download=False):
    content_type, encoding = mimetypes.guess_type(filename)
    safe_inline_types = {
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'video/mp4',
        'video/webm',
        'video/ogg',
    }
    inline = content_type in safe_inline_types and not encoding and not force_download
    response = FileResponse(
        file_obj,
        as_attachment=not inline,
        filename=filename,
        content_type=content_type if inline else 'application/octet-stream',
    )
    response['X-Content-Type-Options'] = 'nosniff'
    response['Content-Security-Policy'] = "sandbox; default-src 'none'"
    response['Cache-Control'] = 'private, no-store'
    response.xframe_options_exempt = True
    return response


@xframe_options_exempt
@api_view(['GET', 'HEAD'])
@permission_classes([IsAuthenticated])
def serve_media(request, path, document_root=None):
    return local_media_response(request.user, path, document_root)
