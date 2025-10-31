from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from users.models import Applicant, Student
from users.serializers import ApplicantSerializer, StudentSerializer
from users.permissions import IsStaff
from backend.utils import api_response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample


class ListApplicantsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaff]
    @extend_schema(
        responses={200: OpenApiResponse(response=ApplicantSerializer(many=True))},
    )
    def get(self, request):
        qs = Applicant.objects.all()
        serializer = ApplicantSerializer(qs, many=True)
        return Response(api_response('success', 'Applicants list', serializer.data))


class ListAdmittedStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaff]
    @extend_schema(
        responses={200: OpenApiResponse(response=ApplicantSerializer(many=True))},
    )
    def get(self, request):
        qs = Applicant.objects.filter(status='admitted')
        serializer = ApplicantSerializer(qs, many=True)
        return Response(api_response('success', 'Admitted applicants', serializer.data))
