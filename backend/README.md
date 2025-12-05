# LMS Service

This repository contains a Django + DRF microservice `lms_service` with an app `classroom` implementing:

- Course and Enrollment caches (read-only sync from portal DB)
- Classroom, Session (Zoom-powered), Resource, Assignment, Submission models
- Zoom integration (meeting create + webhook handler)
- Permissions for enrolled students and instructors
- Management command `sync_portal` to import data from a secondary `portal` DB
- Celery task queue with Redis broker for async operations
- Docker containerization for all services

## Quick Start (Docker)

1. Copy the environment template:
```powershell
cp .env.example .env
```

2. Edit `.env` with your credentials (Zoom API keys, etc.)

3. Build and start all services:
```powershell
docker-compose up --build
```

4. Run migrations (first time only):
```powershell
docker-compose exec web python manage.py migrate
```

5. Create superuser (optional):
```powershell
docker-compose exec web python manage.py createsuperuser
```

6. Access the services:
   - Django API: http://localhost:8000
   - **Swagger UI**: http://localhost:8000/api/docs/
   - **ReDoc**: http://localhost:8000/api/redoc/
   - Flower (Celery monitoring): http://localhost:5555
   - Admin: http://localhost:8000/admin

## Environment Variables

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG` (1/0)
- `DJANGO_ALLOWED_HOSTS` (comma-separated)
- `ZOOM_API_KEY`
- `ZOOM_API_SECRET`
- `ZOOM_WEBHOOK_SECRET`
- `CELERY_BROKER_URL` (automatically set in Docker)
- `CELERY_RESULT_BACKEND` (automatically set in Docker)
- Portal DB settings via `DATABASES['portal']` environment or overrides

## Local Installation (without Docker)

```powershell
python -m venv .venv; ..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Docker Commands

Start all services:
```powershell
docker-compose up
```

Start in background:
```powershell
docker-compose up -d
```

View logs:
```powershell
docker-compose logs -f
```

Stop all services:
```powershell
docker-compose down
```

Sync portal data:
```powershell
docker-compose exec web python manage.py sync_portal
```

### Local Commands (without Docker)

Run migrations and start server:
```powershell
python manage.py migrate
python manage.py runserver
```

Start Celery worker (in separate terminal):
```powershell
celery -A lms_service worker -l info
```

Optional: Start Celery Beat for periodic tasks:
```powershell
celery -A lms_service beat -l info
```

Sync portal:
```powershell
python manage.py sync_portal
```

## Architecture Notes

- **API Documentation**: Interactive API documentation is available at:
  - Swagger UI: `/api/docs/` - Try out API endpoints directly
  - ReDoc: `/api/redoc/` - Beautiful API reference
  - OpenAPI Schema: `/api/schema/` - Download OpenAPI 3.0 schema
- **Zoom Meeting Creation**: When a Session is created with `live_provider='zoom'`, a Celery task is queued to create the Zoom meeting asynchronously. The task includes retry logic (3 retries with 60s delay).
- **Task Queue**: Uses Redis as the message broker. The task will create the meeting, update the Session with `external_meeting_id` and `join_url`, and set status to `scheduled`.
- **Docker Services**:
  - `web`: Django application server
  - `celery_worker`: Async task processor
  - `celery_beat`: Periodic task scheduler
  - `redis`: Message broker and result backend
  - `flower`: Web-based Celery monitoring (http://localhost:5555)
- **Production**: The Docker setup is production-ready. For scaling, run multiple celery_worker containers and use a reverse proxy (nginx) in front of the web service.
