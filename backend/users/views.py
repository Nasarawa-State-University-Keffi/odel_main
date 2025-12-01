from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    RegisterApplicantSerializer,
    RegisterStaffSerializer,
    UserSerializer,
    ApplicantSerializer,
)
from .models import Applicant
from backend.utils import api_response, get_serializer_error_message
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse
from core.logging import get_logger

logger = get_logger(__name__)

signup_example = OpenApiExample(
    'Applicant signup example',
    value={
        "first_name": "John",
        "middle_name": "Doe",
        "last_name": "Smith",
        "email": "john.smith@example.com",
        "phone": "+2348012345678",
        "gender": "M",
        "country": "Nigeria",
        "state": "Lagos",
        "programme_choice": "Computer Science",
        "mode_of_entry": "100",
        "password1": "strongPassword123",
        "password2": "strongPassword123"
    },
    request_only=True,
    description="Note: programme_choice must match an existing programme name in the database (case-sensitive)"
)

staff_signup_example = OpenApiExample(
    'Staff signup example',
    value={"username": "staff1", "email": "staff@example.com", "password": "pass", "role": "coordinator"},
    request_only=True,
)

login_example = OpenApiExample(
    'Login example',
    value={"email": "john.smith@example.com", "password": "strongPassword123"},
    request_only=True,
)

login_response_example = OpenApiExample(
    'Login response example',
    value={"status": "success", "message": "Login successful", "data": {"access": "<jwt>", "refresh": "<jwt>", "user": {}}},
    response_only=True,
)

User = get_user_model()


class ApplicantSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    @extend_schema(
        tags=['Authentication'],
        request=RegisterApplicantSerializer,
        examples=[signup_example],
        responses={201: OpenApiResponse(response=UserSerializer, description='Applicant created')},
    )
    def post(self, request):
        from core.utils import get_setting
        
        logger.info(f"New applicant registration attempt for email: {request.data.get('email', 'N/A')}")
        
        serializer = RegisterApplicantSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"Applicant registered successfully: {user.email} (ID: {user.id})")
            
            user_data = UserSerializer(user).data
            
            # Add applicant_id to response
            try:
                applicant = user.applicant_profile
                user_data['applicant_id'] = applicant.applicant_id
                logger.debug(f"Applicant ID assigned: {applicant.applicant_id}")
            except Exception as e:
                logger.warning(f"Failed to retrieve applicant_id for user {user.id}: {e}")
                pass
            
            # Check if email verification is required (from database)
            require_verification = get_setting('REQUIRE_EMAIL_VERIFICATION', default=True)
            
            # Get site name for personalized message
            site_name = get_setting('SITE_NAME', default='ODeL Portal')
            
            if require_verification:
                if user.is_email_verified:
                    message = f'Registration successful on {site_name}. You can now log in.'
                    logger.info(f"User {user.email} registered with verified email")
                else:
                    message = f'Registration successful on {site_name}. Please check your email to verify your account before logging in.'
                    logger.info(f"Verification email sent to {user.email}")
            else:
                message = f'Registration successful on {site_name}. You can now log in.'
                logger.info(f"User {user.email} registered (verification disabled)")
                
            return Response(
                api_response('success', message, {'user': user_data}),
                status=status.HTTP_201_CREATED
            )
        
        logger.warning(f"Registration failed with validation errors: {serializer.errors}")
        error_message = get_serializer_error_message(serializer.errors)
        return Response(api_response('error', error_message), status=status.HTTP_400_BAD_REQUEST)


class StaffSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    @extend_schema(
        tags=['Authentication'],
        request=RegisterStaffSerializer,
        examples=[staff_signup_example],
        responses={201: OpenApiResponse(response=UserSerializer, description='Staff created')},
    )
    def post(self, request):
        serializer = RegisterStaffSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(api_response('success', 'Staff registered', {'user': UserSerializer(user).data}), status=status.HTTP_201_CREATED)
        error_message = get_serializer_error_message(serializer.errors)
        return Response(api_response('error', error_message), status=status.HTTP_400_BAD_REQUEST)


class JWTLoginView(APIView):
    """Email-based login view with JWT tokens"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'},
                    'password': {'type': 'string'}
                },
                'required': ['email', 'password']
            }
        },
        examples=[login_example, login_response_example],
        responses={200: OpenApiResponse(description='Login successful')},
    )
    def post(self, request, *args, **kwargs):
        from django.contrib.auth import authenticate
        from core.utils import get_setting
        
        email = request.data.get('email', '').lower()
        password = request.data.get('password')
        
        logger.info(f"Login attempt for email: {email}")
        
        if not email or not password:
            logger.warning(f"Login attempt with missing credentials from IP: {request.META.get('REMOTE_ADDR', 'Unknown')}")
            return Response(
                api_response('error', 'Email and password are required'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Login attempt with non-existent email: {email}")
            return Response(
                api_response('error', 'Invalid email or password'),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not user.check_password(password):
            logger.warning(f"Failed login attempt for {email} - incorrect password")
            return Response(
                api_response('error', 'Invalid email or password'),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if email verification is required (from database)
        require_verification = get_setting('REQUIRE_EMAIL_VERIFICATION', default=True)
        if require_verification and not user.is_email_verified:
            logger.warning(f"Login blocked for unverified email: {email}")
            return Response(
                api_response('error', 'Please verify your email before logging in. Check your inbox for verification link.'),
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        user_data = UserSerializer(user).data
        
        # Add applicant_id if applicant
        if hasattr(user, 'applicant_profile'):
            user_data['applicant_id'] = user.applicant_profile.applicant_id
        
        logger.info(f"Successful login for user: {email} (ID: {user.id})")
        
        return Response(
            api_response('success', 'Login successful', {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            }),
            status=status.HTTP_200_OK
        )


class VerifyEmailView(APIView):
    """Verify user email with token"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'token': {'type': 'string'}
                },
                'required': ['token']
            }
        },
        responses={200: OpenApiResponse(description='Email verified successfully')},
    )
    def post(self, request):
        from users.models import EmailVerificationToken
        
        token = request.data.get('token')
        
        logger.info(f"Email verification attempt with token: {token[:10] if token else 'None'}...")
        
        if not token:
            logger.warning("Email verification attempted without token")
            return Response(
                api_response('error', 'Verification token is required'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verification = EmailVerificationToken.objects.select_related('user').get(token=token)
        except EmailVerificationToken.DoesNotExist:
            logger.warning(f"Invalid verification token attempted: {token[:10]}...")
            return Response(
                api_response('error', 'Invalid or expired verification token'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if token is expired
        if verification.is_expired():
            logger.warning(f"Expired verification token used for user: {verification.user.email}")
            return Response(
                api_response('error', 'Verification token has expired. Please request a new one.'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = verification.user
        
        if user.is_email_verified:
            logger.info(f"Email verification attempted for already verified user: {user.email}")
            verification.delete()  # Clean up
            return Response(
                api_response('success', 'Email is already verified'),
                status=status.HTTP_200_OK
            )
        
        # Verify the email
        user.is_email_verified = True
        user.save()
        verification.delete()  # Delete used token
        
        logger.info(f"Email successfully verified for user: {user.email}")
        
        return Response(
            api_response('success', 'Email verified successfully. You can now log in.'),
            status=status.HTTP_200_OK
        )


class ResendVerificationEmailView(APIView):
    """Resend verification email"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'}
                },
                'required': ['email']
            }
        },
        responses={200: OpenApiResponse(description='Verification email sent')},
    )
    def post(self, request):
        from users.utils import generate_verification_token
        from users.models import EmailVerificationToken
        from users.emails import send_verification_email
        from core.utils import get_setting
        
        email = request.data.get('email', '').lower()
        
        logger.info(f"Verification email resend requested for: {email}")
        
        if not email:
            logger.warning("Resend verification attempted without email")
            return Response(
                api_response('error', 'Email is required'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            logger.debug(f"Resend verification requested for non-existent email: {email}")
            return Response(
                api_response('success', 'If the email exists, a verification link has been sent.'),
                status=status.HTTP_200_OK
            )
        
        if user.is_email_verified:
            logger.info(f"Resend verification attempted for already verified user: {email}")
            return Response(
                api_response('error', 'Email is already verified'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if verification is required (from database)
        require_verification = get_setting('REQUIRE_EMAIL_VERIFICATION', default=True)
        if not require_verification:
            logger.warning(f"Resend verification attempted when verification is disabled: {email}")
            return Response(
                api_response('error', 'Email verification is not required'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete old token if exists and create new one
        EmailVerificationToken.objects.filter(user=user).delete()
        token_value = generate_verification_token()
        EmailVerificationToken.objects.create(user=user, token=token_value)
        send_verification_email(user, token_value)
        
        logger.info(f"New verification email sent to: {email}")
        
        return Response(
            api_response('success', 'Verification email sent. Please check your inbox.'),
            status=status.HTTP_200_OK
        )


class ApplicantProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Users'],
        responses={200: OpenApiResponse(response=ApplicantSerializer)},
    )
    def get(self, request):
        try:
            applicant = request.user.applicant_profile
        except Applicant.DoesNotExist:
            return Response(api_response('error', 'Applicant profile not found'), status=status.HTTP_404_NOT_FOUND)
        serializer = ApplicantSerializer(applicant)
        return Response(api_response('success', 'Applicant profile retrieved', serializer.data))
