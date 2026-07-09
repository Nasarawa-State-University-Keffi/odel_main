import base64
import hashlib
import secrets
from urllib.parse import urlencode

import jwt
import requests
from django.conf import settings
from django.core.cache import cache
from jwt import PyJWKClient

from .models import PortalUser
from .services import STAFF_ROLES


OIDC_SESSION_KEY = "oidc_login"


class OIDCConfigurationError(RuntimeError):
    pass


class OIDCAuthenticationError(RuntimeError):
    pass


def get_oidc_setting(name, default=None):
    value = getattr(settings, name, default)
    if value in (None, ""):
        raise OIDCConfigurationError(f"{name} is not configured")
    return value


def get_issuer_url():
    return get_oidc_setting("AUTHENTIK_ISSUER_URL").rstrip("/") + "/"


def get_redirect_uri(request):
    configured_uri = getattr(settings, "AUTHENTIK_REDIRECT_URI", "")
    if configured_uri:
        return configured_uri
    return request.build_absolute_uri("/auth/oidc/callback")


def get_scopes():
    scopes = getattr(settings, "AUTHENTIK_SCOPES", "openid profile email")
    if isinstance(scopes, (list, tuple)):
        return " ".join(scopes)
    return scopes


def get_provider_metadata():
    issuer = get_issuer_url()
    cache_key = f"oidc:metadata:{issuer}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    response = requests.get(f"{issuer}.well-known/openid-configuration", timeout=10)
    response.raise_for_status()
    metadata = response.json()

    if metadata.get("issuer", "").rstrip("/") + "/" != issuer:
        raise OIDCConfigurationError("OIDC discovery issuer does not match AUTHENTIK_ISSUER_URL")

    required_keys = ("authorization_endpoint", "token_endpoint", "jwks_uri")
    missing = [key for key in required_keys if not metadata.get(key)]
    if missing:
        raise OIDCConfigurationError(f"OIDC discovery metadata missing: {', '.join(missing)}")

    cache.set(cache_key, metadata, 3600)
    return metadata


def generate_pkce_pair():
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode("ascii")).digest()
    ).rstrip(b"=").decode("ascii")
    return verifier, challenge


def build_authorization_url(request):
    metadata = get_provider_metadata()
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce_pair()

    request.session[OIDC_SESSION_KEY] = {
        "state": state,
        "nonce": nonce,
        "code_verifier": code_verifier,
    }
    request.session.modified = True

    query = urlencode({
        "response_type": "code",
        "client_id": get_oidc_setting("AUTHENTIK_CLIENT_ID"),
        "redirect_uri": get_redirect_uri(request),
        "scope": get_scopes(),
        "state": state,
        "nonce": nonce,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    })
    return f"{metadata['authorization_endpoint']}?{query}"


def exchange_code_for_tokens(request, code):
    metadata = get_provider_metadata()
    login_state = request.session.get(OIDC_SESSION_KEY) or {}

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": get_redirect_uri(request),
        "client_id": get_oidc_setting("AUTHENTIK_CLIENT_ID"),
        "code_verifier": login_state.get("code_verifier", ""),
    }
    response = requests.post(
        metadata["token_endpoint"],
        data=data,
        auth=(get_oidc_setting("AUTHENTIK_CLIENT_ID"), get_oidc_setting("AUTHENTIK_CLIENT_SECRET")),
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def validate_id_token(id_token, expected_nonce):
    metadata = get_provider_metadata()
    client_id = get_oidc_setting("AUTHENTIK_CLIENT_ID")
    issuer = get_issuer_url()

    signing_key = PyJWKClient(metadata["jwks_uri"]).get_signing_key_from_jwt(id_token)
    claims = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
        audience=client_id,
        issuer=issuer,
    )

    if claims.get("nonce") != expected_nonce:
        raise OIDCAuthenticationError("Invalid ID token nonce")

    return claims


def get_roles_from_claims(claims):
    groups = claims.get("groups") or []
    if isinstance(groups, str):
        groups = [groups]
    return list(groups)


def get_external_id_from_claims(claims):
    username = claims.get("preferred_username")
    email = claims.get("email")
    external_id = username or email
    if not external_id:
        raise OIDCAuthenticationError("OIDC identity is missing preferred_username and email")
    return str(external_id)


def get_full_name_from_claims(claims):
    name = claims.get("name")
    if name:
        return name

    parts = [claims.get("given_name"), claims.get("family_name")]
    full_name = " ".join(part for part in parts if part)
    return full_name or get_external_id_from_claims(claims)


def sync_user_from_claims(claims):
    external_id = get_external_id_from_claims(claims)
    roles = get_roles_from_claims(claims)
    normalized_roles = {str(role).upper() for role in roles}

    user, _ = PortalUser.objects.update_or_create(
        external_id=external_id,
        defaults={
            "email": claims.get("email"),
            "full_name": get_full_name_from_claims(claims),
            "first_name": claims.get("given_name") or "",
            "last_name": claims.get("family_name") or "",
            "roles": roles,
            "is_staff": bool(STAFF_ROLES & normalized_roles),
            "is_active": True,
        },
    )
    return user
