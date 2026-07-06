from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import PortalUserSerializer

from drf_spectacular.utils import extend_schema

class CurrentUserView(APIView):
    """
    Returns details of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=['Global - Authentication'], responses={200: PortalUserSerializer})
    def get(self, request):
        serializer = PortalUserSerializer(request.user)
        return Response(serializer.data)

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

class CustomTokenObtainPairView(TokenObtainPairView):
    @extend_schema(tags=['Global - Authentication'])
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class CustomTokenRefreshView(TokenRefreshView):
    @extend_schema(tags=['Global - Authentication'])
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
