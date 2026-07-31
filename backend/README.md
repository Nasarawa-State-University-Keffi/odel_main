# LMS Service - Django Backend

Production-ready Learning Management System with Zoom integration, classroom management, and student portal synchronization.

## Features

- Classroom and course management
- Assignment and submission tracking
- Student portal synchronization
- Celery-based async task processing
- JWT authentication
- Auto-generated API documentation

## Tech Stack

- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Task Queue**: Celery with Redis
- **API Docs**: drf-spectacular (OpenAPI/Swagger)
- **Containerization**: Docker & Docker Compose
- **Web Server**: Gunicorn + Nginx (production)

## Project Structure

```
backend/
├── lms_service/          # Main Django project
│   ├── settings/         # Environment-specific settings
│   │   ├── __init__.py   # Auto-loads based on DJANGO_ENV
│   │   ├── base.py       # Shared settings
│   │   ├── development.py
│   │   ├── staging.py
│   │   └── production.py
│   ├── celery.py         # Celery configuration
│   ├── urls.py           # URL routing
│   ├── wsgi.py           # WSGI entry point
│   └── asgi.py           # ASGI entry point
├── classroom/            # Classroom app
├── media/                # User-uploaded files
├── staticfiles/          # Collected static files
├── nginx/                # Nginx configuration
├── Dockerfile            # Production-ready Docker image
├── docker-compose.yml    # Multi-container orchestration
├── gunicorn_config.py    # Gunicorn server config
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## Quick Start

### 1. Clone and Setup Environment

```powershell
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, change: DJANGO_SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD
```

### 2. Development Setup

```powershell
# Start all services (PostgreSQL, Redis, Django, Celery)
docker-compose up -d

# Check logs
docker-compose logs -f web

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Access the application
# API: http://localhost:8000/api/
# Admin: http://localhost:8000/admin/
# API Docs: http://localhost:8000/api/docs/
# Celery Monitor: http://localhost:5555 (start with --profile monitoring)
```

### 3. Production Deployment

```powershell
# Set environment to production in .env
# DJANGO_ENV=production
# DJANGO_DEBUG=0

# Update .env with production values
# - Use strong SECRET_KEY
# - Configure proper ALLOWED_HOSTS
# - Set up PostgreSQL connection
# - Configure email settings

# Build and start with Nginx
docker-compose --profile production up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Collect static files (already done in Dockerfile)
docker-compose exec web python manage.py collectstatic --noinput
```

## Docker Compose Profiles

The setup includes optional services via profiles:

```powershell
# Start with Flower monitoring
docker-compose --profile monitoring up -d

# Start with Nginx reverse proxy (production)
docker-compose --profile production up -d

# Start everything
docker-compose --profile monitoring --profile production up -d
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_ENV` | Environment (development/staging/production) | development |
| `DJANGO_SECRET_KEY` | Django secret key (REQUIRED) | - |
| `DJANGO_DEBUG` | Enable debug mode | 1 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection for caching | - |
| `CELERY_BROKER_URL` | Celery broker (Redis) | - |
| `ZOOM_API_KEY` | Zoom API credentials | - |

## Storage Backend Configuration

The LMS supports multiple storage backends for learning content files:

- **local**: Store files locally in `media/` directory
- **s3**: Store files in Amazon S3 bucket
- **cloudinary**: Store files in Cloudinary cloud storage
- **youtube**: Reference YouTube videos (no actual file upload)

### Credential Management

**Important**: Storage credentials are managed through environment variables (`.env` file), NOT stored in the database. This follows security best practices and the [12-factor app](https://12factor.net/config) methodology.

### Setup Instructions

1. **Configure Credentials in `.env` file**:

```env
# AWS S3 (required if using 's3' backend)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=us-east-1

# Cloudinary (required if using 'cloudinary' backend)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# YouTube (required if using 'youtube' backend)
YOUTUBE_API_KEY=your_youtube_api_key
```

2. **Select Active Backend**:

You can manage the active storage backend through:

**Option A: Django Admin Panel**
- Navigate to `http://localhost:8000/admin/content/storagesettings/`
- Select the desired backend (`local`, `s3`, `cloudinary`, or `youtube`)
- Set `is_active` to `True`

**Option B: API Endpoint**
```bash
# Create or update storage settings
POST /api/content/storage-settings/
{
  "backend": "s3",
  "is_active": true
}

# List available backends
GET /api/content/storage-settings/
```

3. **Verify Configuration**:

If you select a backend without proper credentials in `.env`, you'll receive a clear error message:

- **S3**: `"AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_STORAGE_BUCKET_NAME in .env file"`
- **Cloudinary**: `"Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file"`
- **YouTube**: Requires `YOUTUBE_API_KEY` in `.env`

### Upload Content

Once your storage backend is configured:

```bash
# Upload a file (works with local, s3, cloudinary)
POST /api/content/upload/
Content-Type: multipart/form-data

course_id: "CS101"  # or UUID
file: [select file]
title: "Lecture 1: Introduction"
description: "Course introduction and syllabus"

# Add YouTube video reference
POST /api/content/add-youtube/
Content-Type: application/json

{
  "course_id": "CS101",
  "title": "Lecture Video",
  "description": "Week 1 lecture recording",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Storage Backend Comparison

| Backend | Best For | Pros | Cons |
|---------|----------|------|------|
| **local** | Development, small deployments | Simple, no external dependencies | Not scalable, single server |
| **s3** | Production, large files | Scalable, reliable, CDN-ready | Requires AWS account, costs |
| **cloudinary** | Images, videos, media optimization | Auto-optimization, transformations | Costs for large storage |
| **youtube** | Video content already on YouTube | No storage costs, YouTube player | Requires videos uploaded to YouTube |

## Management Commands

```powershell
# Database operations
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py createsuperuser

# Portal synchronization
docker-compose exec web python manage.py sync_portal

# Celery tasks
docker-compose exec celery_worker celery -A lms_service inspect active
docker-compose exec celery_worker celery -A lms_service inspect stats

# Shell access
docker-compose exec web python manage.py shell
docker-compose exec web bash
```

## API Documentation

Once running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/
- **Frontend integration contract**: [`Integration_Workflow.md`](Integration_Workflow.md)

Key student endpoints require a portal bearer token with the `PORTAL_STUDENTS` role (or normalized `STUDENT` alias) and an explicit academic period:

```http
GET /api/dashboard/students/?session=2025%2F2026&semester=First%20Semester
GET /api/student/assessment/assignments/?session=2025%2F2026&semester=First%20Semester
GET /api/student/assessment/quizzes/?session=2025%2F2026&semester=First%20Semester
```

The dashboard route is the student-scoped course API. `GET /api/courses/` returns the global cached course catalog.

## Settings Architecture

Settings are split into multiple files for better maintainability:

- **base.py**: Shared configuration (apps, middleware, DRF, Celery)
- **development.py**: Local development (DEBUG=True, SQLite, etc.)
- **staging.py**: Pre-production testing
- **production.py**: Production (security headers, PostgreSQL, Redis cache)

The correct settings file is loaded automatically based on `DJANGO_ENV`:

```python
# In lms_service/settings/__init__.py
if environment == 'production':
    from .production import *
elif environment == 'staging':
    from .staging import *
else:
    from .development import *
```

## Production Checklist

Before deploying to production:

- [ ] Change `DJANGO_SECRET_KEY` to a strong random value
- [ ] Set `DJANGO_DEBUG=0`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable SSL/HTTPS (`SECURE_SSL_REDIRECT=True`)
- [ ] Configure email backend (SMTP)
- [ ] Set up proper logging
- [ ] Configure CORS for your frontend domain
- [ ] Use strong passwords for PostgreSQL and Redis
- [ ] Set up regular database backups
- [ ] Configure file storage (S3 or similar)
- [ ] Review security settings in production.py

## Monitoring

- **Flower**: Celery task monitoring at http://localhost:5555
- **Django Admin**: http://localhost:8000/admin/
- **Logs**: `docker-compose logs -f [service_name]`

## Troubleshooting

### Database connection issues
```powershell
# Check database status
docker-compose exec db pg_isready

# View database logs
docker-compose logs db
```

### Celery not processing tasks
```powershell
# Check worker status
docker-compose exec celery_worker celery -A lms_service inspect active

# Restart worker
docker-compose restart celery_worker
```

### Static files not loading
```powershell
# Collect static files
docker-compose exec web python manage.py collectstatic --noinput

# Check Nginx configuration
docker-compose exec nginx nginx -t
```

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
