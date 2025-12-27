import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from .services import get_or_sync_portal_user


class PortalJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None

        token = auth.split(" ", 1)[1]

        try:
            payload = jwt.decode(
                token,
                settings.PORTAL_JWT_PUBLIC_KEY,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )

            issuer = getattr(settings, "PORTAL_JWT_ISSUER", None)
            if issuer and payload.get("iss") != issuer:
                raise AuthenticationFailed("Invalid token issuer")

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token")

        try:
            portal_user = get_or_sync_portal_user(token)
        except Exception as e:
            raise AuthenticationFailed(str(e))

        return (portal_user, None)
