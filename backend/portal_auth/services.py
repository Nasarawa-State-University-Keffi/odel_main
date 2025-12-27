from .client import PortalClient
from .models import PortalUser
from .utils import fetch_from_portal

STAFF_ROLES = {"ADMIN", "SUPER_ADMIN", "STAFF"}


def get_or_sync_portal_user(token: str) -> PortalUser:
    client = PortalClient(token)

    # Always fetch once to know who the user is
    user_data = client.get_current_user()

    external_id = user_data.get("userId")
    if not external_id:
        raise ValueError("Portal userId missing")

    cache_key = f"portal:user:{external_id}"

    def sync_user():
        roles = user_data.get("roles", [])
        is_staff = any(role in STAFF_ROLES for role in roles)

        obj, _ = PortalUser.objects.update_or_create(
            external_id=external_id,
            defaults={
                "full_name": user_data.get("name"),
                "email": user_data.get("email"),
                "level": user_data.get("level"),
                "roles": roles,
                "profile_picture": user_data.get("profilePicture"),
                "is_staff": is_staff,
                "is_active": True,
            },
        )
        return obj

    return fetch_from_portal(cache_key, sync_user, ttl=300)
