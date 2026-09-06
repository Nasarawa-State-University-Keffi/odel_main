"""
Media file serving view ensuring inline viewing and correct MIME types for documents.
"""

import os
import mimetypes
from pathlib import Path
from django.conf import settings
from django.http import FileResponse, Http404
from django.utils._os import safe_join
from django.views.decorators.clickjacking import xframe_options_exempt


@xframe_options_exempt
def serve_media(request, path, document_root=None):
    """
    Serve media files from local storage, guaranteeing:
    1. 'Content-Disposition: inline' (never forces download for viewable files).
    2. Accurate 'Content-Type' (specifically 'application/pdf' for PDF documents).
    """
    document_root = document_root or settings.MEDIA_ROOT
    try:
        fullpath = Path(safe_join(document_root, path))
    except (ValueError, Exception):
        raise Http404("Invalid media file path.")

    if not fullpath.exists() or not fullpath.is_file():
        raise Http404("Media file not found.")

    # Determine MIME type
    content_type, encoding = mimetypes.guess_type(str(fullpath))
    if fullpath.suffix.lower() == '.pdf':
        content_type = 'application/pdf'
    elif not content_type:
        content_type = 'application/octet-stream'

    # Open and serve file with inline disposition
    file_handle = open(fullpath, 'rb')
    response = FileResponse(file_handle, content_type=content_type, as_attachment=False)
    
    # Explicitly set inline Content-Disposition header with filename
    response['Content-Disposition'] = f'inline; filename="{fullpath.name}"'
    if encoding:
        response['Content-Encoding'] = encoding

    return response
