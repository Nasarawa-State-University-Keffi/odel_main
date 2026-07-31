import hashlib
import mimetypes
from typing import Optional
from django.utils import timezone
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile
from assessment.models import Assignment, AssignmentSubmission, AssignmentContent, AssignmentSubmissionFile
from learning_resources.storage import get_storage_engine


def get_next_attempt(assignment, student_external_id):
    last = AssignmentSubmission.objects.filter(
        assignment=assignment,
        student_external_id=student_external_id
    ).order_by('-attempt_number').first()

    return 1 if not last else last.attempt_number + 1


def validate_assignment_submission_window(assignment, now=None):
    """Validate publication and the open, due, and hard-close boundaries."""
    now = now or timezone.now()

    if not assignment.is_published:
        raise ValueError("Assignment is not published")

    if now < assignment.open_at:
        raise ValueError("Assignment not yet open")

    if assignment.close_at and now > assignment.close_at:
        raise ValueError("Assignment submission closed")

    if now > assignment.due_at and not assignment.allow_late_submission:
        raise ValueError("Assignment submission closed")


@transaction.atomic
def create_submission(assignment, student_external_id):
    # Serializing attempts per assignment prevents two concurrent requests from
    # choosing the same attempt number for the same student.
    assignment = Assignment.objects.select_for_update().get(pk=assignment.pk)
    validate_assignment_submission_window(assignment)

    attempt = get_next_attempt(assignment, student_external_id)

    if assignment.max_attempts and attempt > assignment.max_attempts:
        raise ValueError("Maximum attempts exceeded")

    return AssignmentSubmission.objects.create(
        assignment=assignment,
        student_external_id=student_external_id,
        attempt_number=attempt
    )


@transaction.atomic
def submit_submission(submission):
    if submission.status != 'draft':
        raise ValueError("Submission already submitted")

    validate_assignment_submission_window(submission.assignment)

    submission.status = 'submitted'
    submission.submitted_at = timezone.now()
    submission.save(update_fields=['status', 'submitted_at'])


# Helper functions
def _calculate_file_hash(file_obj):
    """Calculate SHA-256 hash of file"""
    hasher = hashlib.sha256()
    file_obj.seek(0)
    for chunk in file_obj.chunks():
        hasher.update(chunk)
    file_obj.seek(0)
    return hasher.hexdigest()


def _guess_mime_type(filename):
    """Guess MIME type from filename"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or 'application/octet-stream'


def _generate_storage_path(assignment_id: str, content_type: str, filename: str) -> str:
    """Generate storage path for assignment files"""
    import os
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    clean_filename = os.path.basename(filename)
    return f'assignments/{assignment_id}/{content_type}/{timestamp}_{clean_filename}'


def _generate_submission_storage_path(submission_id: str, filename: str) -> str:
    """Generate storage path for submission files"""
    import os
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    clean_filename = os.path.basename(filename)
    return f'submissions/{submission_id}/{timestamp}_{clean_filename}'


@transaction.atomic
def upload_assignment_content(
    file_obj: UploadedFile,
    assignment: Assignment,
    content_type: str,
    user,
    title: str,
    description: str = '',
    storage_backend: Optional[str] = None,
    is_published: bool = True
) -> AssignmentContent:
    """Upload assignment content file (instructions, resources, examples)"""
    
    # Validate content type
    valid_types = ['instruction', 'resource', 'example']
    if content_type not in valid_types:
        raise ValueError(f"Invalid content_type. Must be one of: {', '.join(valid_types)}")
    
    # Calculate file hash
    content_hash = _calculate_file_hash(file_obj)
    
    # Get storage engine (will use configured backend if storage_backend is None)
    storage = get_storage_engine(storage_backend)
    
    # Get actual backend name for DB storage
    if storage_backend is None:
        storage_backend = 'local'  # Default, but get_storage_engine handles this
    
    # Generate storage path
    storage_path = _generate_storage_path(
        assignment_id=str(assignment.id),
        content_type=content_type,
        filename=file_obj.name
    )
    
    # Upload file
    try:
        file_obj.seek(0)
        stored_path = storage.save(file_obj, storage_path)
        
        # Get file size
        file_size = getattr(file_obj, "size", None)
        if file_size is None and hasattr(storage, "size"):
            file_size = storage.size(stored_path)
        
        # Detect MIME type
        mime_type = getattr(file_obj, "content_type", None) or _guess_mime_type(file_obj.name)
        
        # Create database record
        content = AssignmentContent.objects.create(
            assignment=assignment,
            content_type=content_type,
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
        raise e


@transaction.atomic
def upload_submission_file(
    file_obj: UploadedFile,
    submission: AssignmentSubmission,
    storage_backend: Optional[str] = None
) -> AssignmentSubmissionFile:
    """Upload student submission file"""
    
    # Check if submission is still in draft state
    if submission.status != 'draft':
        raise ValueError("Cannot upload files to a submitted assignment")
    
    # Calculate file hash
    content_hash = _calculate_file_hash(file_obj)
    
    # Get storage engine (will use configured backend if storage_backend is None)
    storage = get_storage_engine(storage_backend)
    
    # Get actual backend name for DB storage
    if storage_backend is None:
        storage_backend = 'local'  # Default, but get_storage_engine handles this
    
    # Generate storage path
    storage_path = _generate_submission_storage_path(
        submission_id=str(submission.id),
        filename=file_obj.name
    )
    
    # Upload file
    try:
        file_obj.seek(0)
        stored_path = storage.save(file_obj, storage_path)
        
        # Get file size
        file_size = getattr(file_obj, "size", None)
        if file_size is None and hasattr(storage, "size"):
            file_size = storage.size(stored_path)
        
        # Detect MIME type
        mime_type = getattr(file_obj, "content_type", None) or _guess_mime_type(file_obj.name)
        
        # Create database record
        submission_file = AssignmentSubmissionFile.objects.create(
            submission=submission,
            storage_path=stored_path,
            original_filename=file_obj.name,
            file_size=file_size,
            mime_type=mime_type,
            storage_backend=storage_backend,
            content_hash=content_hash,
        )
        
        return submission_file
        
    except Exception as e:
        # Attempt cleanup if DB fails
        try:
            storage.delete(storage_path)
        except Exception:
            pass
        raise e
