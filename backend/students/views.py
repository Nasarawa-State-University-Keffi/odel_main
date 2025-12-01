
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from users.models import Student, Applicant
from users.serializers import StudentSerializer, ApplicantSerializer
from backend.utils import api_response
from drf_spectacular.utils import extend_schema, OpenApiResponse


class StudentProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Students'],
        responses={200: OpenApiResponse(response=StudentSerializer)},
    )
    def get(self, request):
        # If user has student profile return it
        if hasattr(request.user, 'student_profile'):
            serializer = StudentSerializer(request.user.student_profile)
            return Response(api_response('success', 'Student profile', serializer.data))

        # Fallback: if applicant and admitted, return applicant data
        if hasattr(request.user, 'applicant_profile') and request.user.applicant_profile.status == 'admitted':
            serializer = ApplicantSerializer(request.user.applicant_profile)
            return Response(api_response('success', 'Applicant admitted - profile', serializer.data))

        return Response(api_response('error', 'Student profile not found or not admitted'), status=status.HTTP_404_NOT_FOUND)
