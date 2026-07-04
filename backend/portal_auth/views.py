from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import PortalUserSerializer

class CurrentUserView(APIView):
    """
    Returns details of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = PortalUserSerializer(request.user)
        return Response(serializer.data)
