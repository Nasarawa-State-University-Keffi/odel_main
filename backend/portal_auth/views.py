import logging

import jwt
import requests
from django.conf import settings
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from jwt import PyJWKClientError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .serializers import PortalUserSerializer
from .oidc import (
    OIDC_SESSION_KEY,
    OIDC_ID_TOKEN_SESSION_KEY,
    OIDCAuthenticationError,
    OIDCConfigurationError,
    build_authorization_url,
    build_end_session_url,
    exchange_code_for_tokens,
    sync_user_from_claims,
    validate_id_token,
)

from drf_spectacular.utils import extend_schema

logger = logging.getLogger(__name__)

@method_decorator(ensure_csrf_cookie, name="dispatch")
class CurrentUserView(APIView):
    """
    Returns details of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=['Global - Authentication'], responses={200: PortalUserSerializer})
    def get(self, request):
        serializer = PortalUserSerializer(request.user)
        data = dict(serializer.data)
        data["csrfToken"] = get_token(request)
        return Response(data)


class OIDCLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=['Global - Authentication'], responses={302: None})
    def get(self, request):
        try:
            return redirect(build_authorization_url(request))
        except OIDCConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.RequestException:
            return Response({"detail": "OIDC provider discovery failed"}, status=status.HTTP_502_BAD_GATEWAY)


class OIDCCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=['Global - Authentication'], responses={302: None})
    def get(self, request):
        error = request.query_params.get("error")
        if error:
            return Response(
                {"detail": error, "description": request.query_params.get("error_description", "")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = request.query_params.get("code")
        state = request.query_params.get("state")
        login_state = request.session.get(OIDC_SESSION_KEY) or {}

        if not code:
            return Response({"detail": "Missing authorization code"}, status=status.HTTP_400_BAD_REQUEST)

        if not state or state != login_state.get("state"):
            return Response({"detail": "Invalid OIDC state"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tokens = exchange_code_for_tokens(request, code)
            id_token = tokens.get("id_token")
            if not id_token:
                return Response({"detail": "OIDC token response missing id_token"}, status=status.HTTP_400_BAD_REQUEST)

            claims = validate_id_token(id_token, login_state.get("nonce"))
            user = sync_user_from_claims(claims)
        except OIDCAuthenticationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        except (jwt.InvalidTokenError, PyJWKClientError):
            return Response({"detail": "Invalid OIDC ID token"}, status=status.HTTP_401_UNAUTHORIZED)
        except OIDCConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.RequestException:
            return Response({"detail": "OIDC token exchange failed"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception:
            logger.exception("Unexpected OIDC login failure")
            return Response({"detail": "OIDC login failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            request.session.pop(OIDC_SESSION_KEY, None)

        request.session["portal_user_id"] = user.id
        # Keep the ID token server-side only. Authentik uses it as a trusted hint
        # when the browser starts RP-initiated logout later.
        request.session[OIDC_ID_TOKEN_SESSION_KEY] = id_token
        # The ID token is validated only to establish the LMS session. Its short
        # lifetime must not become the lifetime of the browser's LMS session;
        # Authentik's SSO session and Django's application session are separate.
        request.session.set_expiry(settings.SESSION_COOKIE_AGE)
        request.session.modified = True

        return redirect(getattr(settings, "OIDC_LOGIN_REDIRECT_URL", "/dashboard"))


class OIDCLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=['Global - Authentication'])
    def post(self, request):
        id_token_hint = request.session.get(OIDC_ID_TOKEN_SESSION_KEY, "")
        logout_url = None
        try:
            logout_url = build_end_session_url(id_token_hint)
        except (OIDCConfigurationError, requests.RequestException):
            # Local LMS logout must still succeed if Authentik discovery is
            # temporarily unavailable. The client will safely return to /login.
            logger.warning("Could not build Authentik end-session URL", exc_info=True)

        request.session.flush()
        return Response({"logout_url": logout_url}, status=status.HTTP_200_OK)
