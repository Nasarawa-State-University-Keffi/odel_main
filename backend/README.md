# ODeL Django REST API

This repository contains a Django REST Framework project for an Open Distance Learning (ODeL) portal. It includes apps for users, admissions, students and staff, JWT authentication, and drf-spectacular schema/docs.

## Environment Setup

### 1. Create Environment File

Copy the example environment file and configure it:

```powershell
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
# Development uses SQLite when DEBUG=True
# Production (DEBUG=False) requires DATABASE_URL
DATABASE_URL=postgresql://username:password@host:port/database_name

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password-here
DEFAULT_FROM_EMAIL=noreply@odel.edu
```

### 2. Quick Setup (Windows PowerShell)

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Database Configuration

**Development (SQLite)**
- Set `DEBUG=True` in `.env`
- SQLite is used automatically
- Database file: `db.sqlite3`

**Production (PostgreSQL)**
- Set `DEBUG=False` in `.env`
- Set `DATABASE_URL=postgresql://user:password@host:port/dbname`
- Install PostgreSQL and create database
- Run migrations: `python manage.py migrate`

### 4. Generate Secret Key (Production)

```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## API Endpoints

### Authentication
- POST /api/auth/signup/applicant/ -- register applicant
- POST /api/auth/signup/staff/ -- register staff
- POST /api/auth/login/ -- obtain JWT
- POST /api/auth/token/refresh/ -- refresh JWT

### Admissions
- GET /api/v1/admissions/programmes/ -- list available programmes
- GET /api/v1/admissions/my-application/ -- get active application
- POST /api/v1/admissions/my-application/ -- create new application
- GET /api/v1/admissions/my-applications/history/ -- view application history
- PUT /api/v1/admissions/application/{id}/update/ -- update application
- GET /api/v1/admissions/application/{id}/preview/ -- preview application
- POST /api/v1/admissions/application/{id}/submit/ -- submit application

### Faculty & Programmes
- GET /api/v1/faculty/ -- list faculties
- GET /api/v1/departments/ -- list departments
- GET /api/v1/programmes/ -- list academic programmes

### Students & Staff
- GET /api/students/profile/ -- view student profile
- GET /api/staff/applicants/ -- staff: list applicants

## Documentation

- Swagger UI: http://localhost:8000/api/docs/
- OpenAPI Schema: http://localhost:8000/api/schema/

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| SECRET_KEY | Django secret key | (insecure default) | Yes (production) |
| DEBUG | Debug mode | True | No |
| ALLOWED_HOSTS | Comma-separated hosts | localhost,127.0.0.1 | Yes (production) |
| DATABASE_URL | PostgreSQL connection string | (SQLite used) | Yes (when DEBUG=False) |
| EMAIL_BACKEND | Email backend class | console.EmailBackend | No |
| EMAIL_HOST | SMTP server | smtp.gmail.com | No |
| EMAIL_PORT | SMTP port | 587 | No |
| EMAIL_USE_TLS | Use TLS | True | No |
| EMAIL_HOST_USER | SMTP username | - | No |
| EMAIL_HOST_PASSWORD | SMTP password | - | No |
| DEFAULT_FROM_EMAIL | Default sender email | noreply@odel.edu | No |

## Production Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Generate and set strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set up PostgreSQL database
- [ ] Configure `DATABASE_URL`
- [ ] Set up SMTP email backend
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Set up SSL/HTTPS
- [ ] Configure web server (nginx/Apache)
- [ ] Set up process manager (gunicorn/uwsgi)
