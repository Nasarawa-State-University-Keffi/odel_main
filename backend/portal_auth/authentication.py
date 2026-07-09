import jwt
from rest_framework.authentication import BaseAuthentication, SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from .services import get_or_sync_portal_user
from .models import PortalUser


class PortalJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None

        token = auth.split(" ", 1)[1]

        # try:
        #     payload = jwt.decode(
        #         token,
        #         settings.PORTAL_JWT_PUBLIC_KEY,
        #         algorithms=["RS256"],
        #         options={"verify_aud": False},
        #     )

        #     issuer = getattr(settings, "PORTAL_JWT_ISSUER", None)
        #     if issuer and payload.get("iss") != issuer:
        #         raise AuthenticationFailed("Invalid token issuer")

        # except jwt.ExpiredSignatureError:
        #     raise AuthenticationFailed("Token expired")
        # except jwt.InvalidTokenError:
        #     raise AuthenticationFailed("Invalid token")
        # TODO : For now, we skip JWT validation and directly fetch user info from portal

        try:
            portal_user = get_or_sync_portal_user(token)
        except Exception as e:
            raise AuthenticationFailed(str(e))

        return (portal_user, token)


class PortalSessionAuthentication(SessionAuthentication):
    def authenticate(self, request):
        portal_user_id = request.session.get("portal_user_id")
        if not portal_user_id:
            return None

        try:
            user = PortalUser.objects.get(id=portal_user_id, is_active=True)
        except PortalUser.DoesNotExist:
            request.session.pop("portal_user_id", None)
            return None

        self.enforce_csrf(request)
        return (user, None)

try:
    from drf_spectacular.extensions import OpenApiAuthenticationExtension
    
    class PortalJWTAuthenticationScheme(OpenApiAuthenticationExtension):
        target_class = 'portal_auth.authentication.PortalJWTAuthentication'
        name = 'jwtAuth'

        def get_security_definition(self, auto_schema):
            return {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
except ImportError:
    pass
