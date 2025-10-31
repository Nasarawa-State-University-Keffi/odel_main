# ODeL Django REST API (boilerplate)

This repository contains a starter Django REST Framework project for an Open Distance Learning (ODeL) portal. It includes apps for users, admissions, students and staff, JWT authentication, and drf-spectacular schema/docs.

Quick setup (Windows PowerShell):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API endpoints (examples):

- POST /api/auth/signup/applicant/ -- register applicant
- POST /api/auth/signup/staff/ -- register staff
- POST /api/auth/login/ -- obtain JWT (returns uniform response)
- GET /api/admissions/download/applicants/ -- download CSV (admission officer)
- POST /api/admissions/upload/admitted/ -- upload CSV (admission officer)
- GET /api/students/profile/ -- view student profile
- GET /api/staff/applicants/ -- staff: list applicants

Docs:

- /api/schema/ and /api/docs/ (Swagger)
