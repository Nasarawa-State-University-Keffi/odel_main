import csv
from io import StringIO
from django.http import HttpResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from users.models import Applicant, Student
from core.utils import api_response, get_serializer_error_message, get_setting
from users.permissions import IsAdmissionOfficer
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from core.logging import get_logger

from .models import Application
from programmes.models import Programme
from .serializers import (
    ApplicationSerializer,
    ApplicationPreviewSerializer,
)
from .utils import verify_application_results

User = get_user_model()
logger = get_logger(__name__)


class ProgrammeListView(APIView):
    """List all active programmes"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        tags=['Admissions'],
        responses={200: OpenApiResponse(response='ProgrammeSerializer(many=True)')},
    )
    def get(self, request):
        from programmes.serializers import ProgrammeSerializer
        programmes = Programme.objects.select_related(
            'department', 'department__faculty', 'degree_type'
        ).all()
        serializer = ProgrammeSerializer(programmes, many=True)
        return Response(
            api_response('success', 'Programmes retrieved', serializer.data)
        )


class ApplicationUpdateView(APIView):
    """Update application (personal info, program, exam results, subjects)"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        tags=['Admissions'],
        request=ApplicationSerializer,
        responses={200: OpenApiResponse(response=ApplicationSerializer)},
    )
    def put(self, request, application_id):
        logger.info(
            f"Application update request for ID {application_id} "
            f"by user {request.user.email}"
        )
        
        # Get application
        application = get_object_or_404(Application, id=application_id)
        
        # Check ownership
        if application.applicant.user != request.user:
            logger.warning(
                f"Unauthorized application update attempt by {request.user.email}"
            )
            return Response(
                api_response('error', 'You can only update your own application'),
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already submitted
        if application.status != 'draft':
            logger.warning(
                f"Attempt to update non-draft application {application_id}"
            )
            return Response(
                api_response(
                    'error', 
                    'Cannot update application after submission'
                ),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update application
        serializer = ApplicationSerializer(
            application, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Application {application_id} updated successfully")
            return Response(
                api_response(
                    'success', 
                    'Application updated successfully',
                    serializer.data
                )
            )
        
        error_message = get_serializer_error_message(serializer.errors)
        logger.warning(
            f"Application update validation failed: {serializer.errors}"
        )
        return Response(
            api_response('error', error_message),
            status=status.HTTP_400_BAD_REQUEST
        )


class ApplicationPreviewView(APIView):
    """Preview complete application before submission"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        tags=['Admissions'],
        responses={200: OpenApiResponse(response=ApplicationPreviewSerializer)},
    )
    def get(self, request, application_id):
        logger.info(
            f"Application preview request for ID {application_id} "
            f"by user {request.user.email}"
        )
        
        # Get application
        application = get_object_or_404(Application, id=application_id)
        
        # Check ownership
        if application.applicant.user != request.user:
            logger.warning(
                f"Unauthorized application preview attempt by {request.user.email}"
            )
            return Response(
                api_response('error', 'You can only view your own application'),
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Serialize with full details
        serializer = ApplicationPreviewSerializer(application)
        
        logger.info(f"Application {application_id} preview generated")
        return Response(
            api_response(
                'success', 
                'Application preview',
                serializer.data
            )
        )


class ApplicationSubmitView(APIView):
    """Submit application for review"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        tags=['Admissions'],
        responses={200: OpenApiResponse(response=ApplicationSerializer)},
    )
    def post(self, request, application_id):
        logger.info(
            f"Application submission request for ID {application_id} "
            f"by user {request.user.email}"
        )
        
        # Get application
        application = get_object_or_404(Application, id=application_id)
        
        # Check ownership
        if application.applicant.user != request.user:
            logger.warning(
                f"Unauthorized application submission attempt "
                f"by {request.user.email}"
            )
            return Response(
                api_response('error', 'You can only submit your own application'),
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already submitted
        if application.status != 'draft':
            logger.warning(
                f"Attempt to re-submit application {application_id}"
            )
            return Response(
                api_response('error', 'Application already submitted'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate completeness
        is_complete, errors = application.is_complete()
        
        if not is_complete:
            logger.warning(
                f"Incomplete application submission attempt: {errors}"
            )
            return Response(
                api_response(
                    'error', 
                    'Application is incomplete',
                    {'errors': errors}
                ),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get verification mode from database settings
        verification_mode = get_setting(
            'RESULT_VERIFICATION_MODE',
            default='manual'
        )
        
        logger.info(
            f"Processing application {application_id} "
            f"with verification mode: {verification_mode}"
        )
        
        # Update application status and timestamp
        application.submitted_at = timezone.now()
        
        if verification_mode == 'auto':
            # Automatic verification
            all_verified, verification_results = verify_application_results(
                application
            )
            
            if all_verified:
                application.status = 'verified'
                message = 'Application submitted and verified successfully'
                logger.info(
                    f"Application {application_id} auto-verified successfully"
                )
            else:
                application.status = 'failed_verification'
                message = 'Application submitted but verification failed'
                logger.warning(
                    f"Application {application_id} verification failed"
                )
            
            application.save()
            
            serializer = ApplicationSerializer(application)
            return Response(
                api_response(
                    'success', 
                    message,
                    {
                        'application': serializer.data,
                        'verification_results': verification_results
                    }
                )
            )
        else:
            # Manual verification mode
            application.status = 'under_review'
            application.save()
            
            logger.info(
                f"Application {application_id} submitted for manual review"
            )
            
            serializer = ApplicationSerializer(application)
            return Response(
                api_response(
                    'success', 
                    'Application submitted successfully. It will be reviewed by admissions staff.',
                    serializer.data
                )
            )


class MyApplicationView(APIView):
    """Get or create the authenticated user's active application"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        tags=['Admissions'],
        responses={200: OpenApiResponse(response=ApplicationSerializer)},
    )
    def get(self, request):
        """Get user's active application"""
        logger.info(f"Application retrieval request by {request.user.email}")
        
        try:
            applicant = request.user.applicant_profile
        except Applicant.DoesNotExist:
            logger.error(f"No applicant profile for user {request.user.email}")
            return Response(
                api_response('error', 'Applicant profile not found'),
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get active application only
        try:
            application = Application.objects.get(
                applicant=applicant,
                is_active=True
            )
            serializer = ApplicationSerializer(application)
            return Response(
                api_response(
                    'success',
                    'Application retrieved',
                    serializer.data
                )
            )
        except Application.DoesNotExist:
            logger.info(f"No active application found for {applicant.applicant_id}")
            return Response(
                api_response(
                    'error', 
                    'No active application found. Please create one.'
                ),
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        tags=['Admissions'],
        request=None,
        responses={201: OpenApiResponse(response=ApplicationSerializer)},
    )
    def post(self, request):
        """Create a new application for the user"""
        logger.info(f"New application creation request by {request.user.email}")
        
        try:
            applicant = request.user.applicant_profile
        except Applicant.DoesNotExist:
            logger.error(f"No applicant profile for user {request.user.email}")
            return Response(
                api_response('error', 'Applicant profile not found'),
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if there's an active draft application
        active_draft = Application.objects.filter(
            applicant=applicant,
            is_active=True,
            status='draft'
        ).first()
        
        if active_draft:
            logger.warning(
                f"User {request.user.email} attempted to create new application "
                f"while having active draft {active_draft.application_id}"
            )
            return Response(
                api_response(
                    'error',
                    'You already have an active draft application. '
                    'Please complete or cancel it before creating a new one.',
                    {'active_application_id': active_draft.application_id}
                ),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current session from settings
        current_session = get_setting(
            'CURRENT_ADMISSION_SESSION',
            default='2024/2025'
        )
        
        # Create new application (this will automatically deactivate others)
        application = Application.objects.create(
            applicant=applicant,
            session=current_session,
            mode_of_entry=applicant.mode_of_entry,
            sitting_type='one',
            status='draft',
            is_active=True
        )
        
        logger.info(
            f"Created new application {application.application_id} "
            f"for applicant {applicant.applicant_id}"
        )
        
        serializer = ApplicationSerializer(application)
        return Response(
            api_response(
                'success',
                'New application created successfully',
                serializer.data
            ),
            status=status.HTTP_201_CREATED
        )


class MyApplicationsHistoryView(APIView):
    """Get all applications for the authenticated user (application history)"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        tags=['Admissions'],
        responses={200: OpenApiResponse(response=ApplicationSerializer(many=True))},
    )
    def get(self, request):
        """Get all user's applications"""
        logger.info(f"Application history request by {request.user.email}")
        
        try:
            applicant = request.user.applicant_profile
        except Applicant.DoesNotExist:
            logger.error(f"No applicant profile for user {request.user.email}")
            return Response(
                api_response('error', 'Applicant profile not found'),
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all applications for this applicant
        applications = Application.objects.filter(
            applicant=applicant
        ).order_by('-created_at')
        
        serializer = ApplicationSerializer(applications, many=True)
        return Response(
            api_response(
                'success',
                f'Found {applications.count()} application(s)',
                serializer.data
            )
        )


# Legacy views for backward compatibility
class DownloadApplicantsCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmissionOfficer]
    @extend_schema(
        tags=['Admissions'],
        responses={200: OpenApiResponse(description='CSV file of applicants', response=OpenApiTypes.BINARY)},
    )
    def get(self, request):
        applicants = Applicant.objects.all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['applicant_id', 'username', 'email', 'phone', 'programme_choice', 'status'])
        for a in applicants:
            writer.writerow([a.applicant_id, a.user.username, a.user.email, a.user.phone, a.programme_choice, a.status])
        resp = HttpResponse(output.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename="applicants.csv"'
        return resp


class UploadAdmittedCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmissionOfficer]
    @extend_schema(
        tags=['Admissions'],
        request={"multipart/form-data": {
            "type": "object",
            "properties": {"file": {"type": "string", "format": "binary"}}
        }},
        responses={200: OpenApiResponse(description='Upload results')},
        examples=[OpenApiExample('Upload example', value={"file": "applicants.csv"}, request_only=True)],
    )
    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response(api_response('error', 'No file uploaded'), status=status.HTTP_400_BAD_REQUEST)
        decoded = f.read().decode('utf-8')
        reader = csv.DictReader(StringIO(decoded))
        updated = 0
        created_students = 0
        for row in reader:
            # Expect at least applicant_id and matric_no and programme
            aid = row.get('applicant_id') or row.get('applicant') or row.get('id')
            matric = row.get('matric_no') or row.get('matric')
            programme = row.get('programme') or row.get('programme_choice')
            try:
                applicant = Applicant.objects.get(applicant_id=aid)
            except Applicant.DoesNotExist:
                continue
            applicant.status = 'admitted'
            applicant.save()
            # mark user role via groups
            user = applicant.user
            try:
                from django.contrib.auth.models import Group
                students_grp, _ = Group.objects.get_or_create(name='Students')
                user.groups.add(students_grp)
            except Exception:
                pass
            user.role = 'student'
            user.save()
            # create student record if matric provided
            if matric and programme:
                Student.objects.update_or_create(user=user, defaults={'matric_no': matric, 'programme': programme})
                created_students += 1
            updated += 1
        return Response(api_response('success', f'Updated {updated} applicants; created {created_students} students'))
