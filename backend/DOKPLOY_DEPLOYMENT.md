# Dokploy Deployment

This backend is configured for Dokploy using Docker Compose.

## Files

Use these files from the `backend` directory:

```text
docker-compose.yml
.env.dokploy.example
Dockerfile
docker/entrypoint.sh
```

The compose file builds the Django backend from the current `backend` directory, connects to your bare-metal Postgres server via `DATABASE_URL`, runs Redis as an internal service, starts Celery worker and Celery Beat, and exposes the Django web container on port `8000` for Dokploy domain routing.

## Dokploy Setup

Create a new Docker Compose application in Dokploy with:

```text
Compose file path: backend/docker-compose.yml
Service for domain routing: web
Container port: 8000
```

Add your backend domain in Dokploy's Domains tab and point it to:

```text
service: web
port: 8000
```

The `web` service is attached to Dokploy's external proxy network:

```text
dokploy-network
```

Redis, Celery worker, and Celery Beat also use a private internal network:

```text
lms_internal
```

This lets Dokploy route public traffic to `web` while keeping internal services off the shared proxy network.

Use Dokploy's Environment UI for all runtime variables. The values from that UI are used by Docker Compose for `${...}` interpolation and are also written by Dokploy to an environment file for the running services.

Because the compose file is inside `backend`, the generated env file should be:

```text
backend/.env
```

The compose file injects it with:

```yaml
env_file:
  - .env
```

Critical Django settings, database/Redis URLs, CORS/CSRF origins, Authentik settings, and portal settings are also listed explicitly in `docker-compose.yml`. This makes Dokploy fail early during deployment if required values such as `AUTHENTIK_CLIENT_SECRET` or `DATABASE_URL` are missing.

## Required Dokploy Environment Variables

Copy the keys from:

```text
backend/.env.dokploy.example
```

Then enter the real values in Dokploy's Environment UI. Do not commit real secrets into the repo.

Minimum production values:

```env
DJANGO_ENV=production
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=api.example.edu.ng

DATABASE_URL=postgresql://lms_user:<strong-password>@<postgres-host>:5432/lms_db
REDIS_PASSWORD=<strong-password>

CORS_ALLOWED_ORIGINS=https://lms.example.edu.ng
CSRF_TRUSTED_ORIGINS=https://lms.example.edu.ng

AUTHENTIK_ISSUER_URL=https://auth.example.edu.ng/application/o/lms/
AUTHENTIK_CLIENT_ID=<authentik-client-id>
AUTHENTIK_CLIENT_SECRET=<authentik-client-secret>
AUTHENTIK_REDIRECT_URI=https://api.example.edu.ng/auth/oidc/callback
AUTHENTIK_SCOPES=openid profile email
OIDC_LOGIN_REDIRECT_URL=https://lms.example.edu.ng/dashboard
```

For same-domain, different-subdomain deployment:

```text
frontend: https://lms.example.edu.ng
backend:  https://api.example.edu.ng
```

set:

```env
DJANGO_ALLOWED_HOSTS=api.example.edu.ng
CORS_ALLOWED_ORIGINS=https://lms.example.edu.ng
CSRF_TRUSTED_ORIGINS=https://lms.example.edu.ng
AUTHENTIK_REDIRECT_URI=https://api.example.edu.ng/auth/oidc/callback
OIDC_LOGIN_REDIRECT_URL=https://lms.example.edu.ng/dashboard
```

## Startup Behavior

The web container runs:

```text
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn --config gunicorn_config.py lms.wsgi:application
```

This is controlled by:

```env
RUN_MIGRATIONS=1
RUN_COLLECTSTATIC=1
```

Set either value to `0` only if you want to run that step manually.

## Bare-Metal Postgres

The compose file does not start Postgres. It expects `DATABASE_URL` to point to the Postgres service running on the server or private network.

Example values:

```env
DATABASE_URL=postgresql://lms_user:password@172.17.0.1:5432/lms_db
DATABASE_URL=postgresql://lms_user:password@10.0.0.5:5432/lms_db
DATABASE_URL=postgresql://lms_user:password@postgres.internal.example.edu.ng:5432/lms_db
```

Make sure Postgres is configured to accept connections from Docker containers:

```text
listen_addresses includes the reachable interface
pg_hba.conf allows the Docker bridge/private network
server firewall allows TCP 5432 from Docker/container network
```

## Health Check

The deployment health endpoint is:

```text
GET /health/
```

The Dockerfile and compose health checks use this endpoint.

## Volumes

The compose file uses named Docker volumes:

```text
redis_data
media_data
static_data
```

The compose file uses these Docker networks:

```text
dokploy-network  external Dokploy proxy network
lms_internal     private app network for Redis/Celery/web
```

Use Dokploy volume backups for `media_data`. Back up the bare-metal Postgres database using your server/database backup process.

## Notes

- Do not expose Postgres or Redis with public ports.
- Postgres is external to Docker and configured via `DATABASE_URL`.
- Configure the public backend domain through Dokploy's Domains tab.
- Keep `SESSION_COOKIE_SAMESITE=Lax` and `CSRF_COOKIE_SAMESITE=Lax` for same-site subdomain deployments.
- The frontend must call backend APIs with credentials enabled.
- The frontend should get `csrfToken` from `GET /auth/me` and send it as `X-CSRFToken` on `POST`, `PUT`, `PATCH`, and `DELETE` requests.
