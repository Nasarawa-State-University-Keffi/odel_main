"""Private file storage and cleanup for the shared resource library."""

import logging
import mimetypes
import time
from pathlib import Path
from uuid import uuid4

from django.db import transaction
from rest_framework.exceptions import ValidationError

from learning_resources.storage import get_storage_engine
from learning_resources.storage.router import _get_configured_backend

logger = logging.getLogger(__name__)


def store_file(file_obj):
    backend = _get_configured_backend()
    if backend not in ('local', 's3', 'cloudinary'):
        raise ValidationError(
            {'file': 'Choose local, S3, or Cloudinary storage for file attachments.'}
        )
    filename = Path(file_obj.name).name
    path = f'library/{uuid4().hex}{Path(filename).suffix.lower()}'
    mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
    storage = get_storage_engine(backend)
    file_obj.seek(0)
    try:
        if backend == 's3':
            # Library objects stay private even when course files use public ACLs.
            storage._get_client().upload_fileobj(
                file_obj,
                storage.bucket_name,
                path,
                ExtraArgs={
                    'ContentType': mime_type,
                    'ContentDisposition': 'attachment',
                },
            )
        elif backend == 'cloudinary':
            import cloudinary.uploader

            result = cloudinary.uploader.upload(
                file_obj,
                public_id=path,
                resource_type='raw',
                type='private',
                overwrite=False,
            )
            path = result['public_id']
        else:
            path = storage.save(file_obj, path)
    except Exception:
        remove_file(backend, path)
        raise
    resource_type = mime_type.split('/', 1)[0]
    if resource_type not in ('image', 'video', 'audio'):
        resource_type = 'document'
    return dict(
        storage_backend=backend,
        storage_path=path,
        original_filename=filename,
        mime_type=mime_type,
        file_size=file_obj.size,
        resource_type=resource_type,
    )


def remove_file(backend, path):
    if not path:
        return
    try:
        if backend == 'cloudinary':
            get_storage_engine(backend)
            import cloudinary.uploader

            cloudinary.uploader.destroy(
                path, resource_type='raw', type='private', invalidate=True
            )
        else:
            get_storage_engine(backend).delete(path)
    except Exception:
        logger.exception('Could not remove a library attachment from %s', backend)


def save_resource(serializer):
    file_obj = serializer.validated_data.pop('file', None)
    uploaded = store_file(file_obj) if file_obj else {}
    try:
        with transaction.atomic():
            instance = serializer.instance
            if instance is not None:
                # Serialize replacements/deletion so concurrent edits cannot orphan old files.
                instance = (
                    type(instance).objects.select_for_update().get(pk=instance.pk)
                )
                serializer.instance = instance
            previous = (
                (instance.storage_backend, instance.storage_path) if instance else None
            )
            resource = serializer.save(**uploaded)
            if file_obj and previous and previous[1]:
                transaction.on_commit(lambda: remove_file(*previous))
            return resource
    except Exception:
        if uploaded:
            remove_file(uploaded['storage_backend'], uploaded['storage_path'])
        raise


def open_remote_file(resource):
    storage = get_storage_engine(resource.storage_backend)
    if resource.storage_backend == 's3':
        return storage._get_client().get_object(
            Bucket=storage.bucket_name,
            Key=resource.storage_path,
        )['Body']
    if resource.storage_backend == 'cloudinary':
        import cloudinary.utils
        import requests

        url = cloudinary.utils.private_download_url(
            resource.storage_path,
            None,
            resource_type='raw',
            type='private',
            expires_at=int(time.time()) + 60,
        )
        response = requests.get(url, stream=True, timeout=(5, 60))
        try:
            response.raise_for_status()
        except Exception:
            response.close()
            raise
        response.raw.decode_content = True
        return response.raw
    raise ValueError('Unsupported library storage backend')
