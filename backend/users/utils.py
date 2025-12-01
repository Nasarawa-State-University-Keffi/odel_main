from datetime import datetime
import secrets


def generate_applicant_id() -> str:
    """Generate applicant ID in format odelYYXXXX (e.g., odel250001)"""
    from users.models import Applicant
    
    current_year = datetime.now().year % 100  # Get last 2 digits of year
    
    # Get the last applicant created this year to determine next serial number
    year_prefix = f'odel{current_year:02d}'
    last_applicant = Applicant.objects.filter(
        applicant_id__startswith=year_prefix
    ).order_by('-applicant_id').first()
    
    if last_applicant:
        # Extract the serial part and increment
        try:
            last_serial = int(last_applicant.applicant_id[6:])  # Get last 4 digits
            next_serial = last_serial + 1
        except (ValueError, IndexError):
            next_serial = 1
    else:
        next_serial = 1
    
    return f'{year_prefix}{next_serial:04d}'


def generate_application_id() -> str:
    """Generate application ID in format appYYXXXX (e.g., app250001)"""
    from admissions.models import Application
    
    current_year = datetime.now().year % 100  # Get last 2 digits of year
    
    # Get the last application created this year to determine next serial number
    year_prefix = f'app{current_year:02d}'
    last_application = Application.objects.filter(
        application_id__startswith=year_prefix
    ).order_by('-application_id').first()
    
    if last_application:
        # Extract the serial part and increment
        try:
            last_serial = int(last_application.application_id[5:])  # Get last 4 digits
            next_serial = last_serial + 1
        except (ValueError, IndexError):
            next_serial = 1
    else:
        next_serial = 1
    
    return f'{year_prefix}{next_serial:04d}'


def generate_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)
