"""
Custom exception handling for consistent error responses.
All errors return format: {'status': 'error', 'detail': '...'}
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format.
    
    Format: {'status': 'error', 'detail': 'error message'}
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Standardize error response format
        error_detail = None
        
        # Extract error message from various formats
        if isinstance(response.data, dict):
            # Handle validation errors with multiple fields
            if 'detail' in response.data:
                error_detail = response.data['detail']
            elif len(response.data) == 1:
                # Single field error
                field_name, field_errors = next(iter(response.data.items()))
                if isinstance(field_errors, list):
                    error_detail = f"{field_name}: {', '.join(str(e) for e in field_errors)}"
                else:
                    error_detail = f"{field_name}: {str(field_errors)}"
            else:
                # Multiple field errors
                errors = []
                for field_name, field_errors in response.data.items():
                    if isinstance(field_errors, list):
                        errors.append(f"{field_name}: {', '.join(str(e) for e in field_errors)}")
                    else:
                        errors.append(f"{field_name}: {str(field_errors)}")
                error_detail = "; ".join(errors)
        elif isinstance(response.data, list):
            error_detail = ", ".join(str(e) for e in response.data)
        else:
            error_detail = str(response.data)
        
        # Return standardized format
        response.data = {
            'status': 'error',
            'detail': error_detail
        }
    
    return response
