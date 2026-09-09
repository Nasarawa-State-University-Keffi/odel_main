from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from portal_auth.models import PortalUser


@database_sync_to_async
def get_portal_session_user(portal_user_id):
    if not portal_user_id:
        return AnonymousUser()
    try:
        return PortalUser.objects.get(id=portal_user_id, is_active=True)
    except PortalUser.DoesNotExist:
        return AnonymousUser()


class PortalSessionAuthMiddleware:
    """Resolve the Authentik-backed Django session for websocket clients."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        session = scope.get('session')
        portal_user_id = session.get('portal_user_id') if session else None
        scope['user'] = await get_portal_session_user(portal_user_id)
        return await self.inner(scope, receive, send)
