from typing import Any, Optional

def api_response(status: str, message: str, data: Optional[Any] = None) -> dict:
    """Uniform API response helper.

    status: 'success' or 'error'
    message: human readable message
    data: optional payload
    """
    payload = {
        'status': status,
        'message': message,
    }
    if data is not None:
        payload['data'] = data
    return payload
