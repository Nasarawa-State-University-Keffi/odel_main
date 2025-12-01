from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from core.logging import get_logger

logger = get_logger(__name__)


def send_verification_email(user, verification_token):
    """Send email verification link to user"""
    logger.info(f"Preparing verification email for user: {user.email}")
    
    subject = 'Verify Your ODeL Account'
    
    # Create verification link
    # Use BACKEND_URL for API endpoint, or FRONTEND_URL if frontend handles verification
    backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
    frontend_url = getattr(settings, 'FRONTEND_URL', None)
    
    # If frontend exists, use frontend verification page, otherwise use backend API
    if frontend_url:
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
    else:
        # Backend API endpoint
        verification_link = f"{backend_url}/api/auth/verify-email/?token={verification_token}"
    
    # HTML message
    html_message = f"""
    <html>
        <body>
            <h2>Welcome to ODeL!</h2>
            <p>Hi {user.first_name},</p>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <p><a href="{verification_link}">Verify Email Address</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>{verification_link}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>ODeL Admissions Team</p>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    try:
        send_mail(
            subject,
            plain_message,
            from_email,
            recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Verification email sent successfully to: {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False
