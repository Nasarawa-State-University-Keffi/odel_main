from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    RegisterApplicantSerializer,
    RegisterStaffSerializer,
    UserSerializer,
    ApplicantSerializer,
)
from .models import Applicant
from backend.utils import api_response
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse

signup_example = OpenApiExample(
    'Applicant signup example',
    value={"username": "jdoe", "email": "jdoe@example.com", "password": "strongpass"},
    request_only=True,
)

staff_signup_example = OpenApiExample(
    'Staff signup example',
    value={"username": "staff1", "email": "staff@example.com", "password": "pass", "role": "coordinator"},
    request_only=True,
)

login_example = OpenApiExample(
    'Login example',
    value={"username": "jdoe", "password": "strongpass"},
    request_only=True,
)

login_response_example = OpenApiExample(
    'Login response example',
    value={"status": "success", "message": "Login successful", "data": {"access": "<jwt>", "refresh": "<jwt>"}},
    response_only=True,
)

User = get_user_model()


class ApplicantSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    @extend_schema(
        request=RegisterApplicantSerializer,
        examples=[signup_example],
        responses={201: OpenApiResponse(response=UserSerializer, description='Applicant created')},
    )
    def post(self, request):
        serializer = RegisterApplicantSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(api_response('success', 'Applicant registered', {'user': UserSerializer(user).data}), status=status.HTTP_201_CREATED)
        return Response(api_response('error', 'Validation error', serializer.errors), status=status.HTTP_400_BAD_REQUEST)


class StaffSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    @extend_schema(
        request=RegisterStaffSerializer,
        examples=[staff_signup_example],
        responses={201: OpenApiResponse(response=UserSerializer, description='Staff created')},
    )
    def post(self, request):
        serializer = RegisterStaffSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(api_response('success', 'Staff registered', {'user': UserSerializer(user).data}), status=status.HTTP_201_CREATED)
        return Response(api_response('error', 'Validation error', serializer.errors), status=status.HTTP_400_BAD_REQUEST)


class JWTLoginView(TokenObtainPairView):
    # We inherit the view; wrap responses to uniform format
    @extend_schema(
        request=None,
        examples=[login_example, login_response_example],
    )
    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        if resp.status_code == 200:
            data = resp.data
            return Response(api_response('success', 'Login successful', data), status=200)
        return Response(api_response('error', 'Login failed', resp.data), status=resp.status_code)


class ApplicantProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(response=ApplicantSerializer)},
    )
    def get(self, request):
        try:
            applicant = request.user.applicant_profile
        except Applicant.DoesNotExist:
            return Response(api_response('error', 'Applicant profile not found'), status=status.HTTP_404_NOT_FOUND)
        serializer = ApplicantSerializer(applicant)
        return Response(api_response('success', 'Applicant profile retrieved', serializer.data))
