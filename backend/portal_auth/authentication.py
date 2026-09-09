from rest_framework.authentication import SessionAuthentication
from .models import PortalUser


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
    
    class PortalSessionAuthenticationScheme(OpenApiAuthenticationExtension):
        target_class = 'portal_auth.authentication.PortalSessionAuthentication'
        name = 'cookieAuth'

        def get_security_definition(self, auto_schema):
            return {
                'type': 'apiKey',
                'in': 'cookie',
                'name': 'sessionid',
            }
except ImportError:
    pass
