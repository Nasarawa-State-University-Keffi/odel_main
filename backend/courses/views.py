"""
API-only Backend - All frontend template-based views have been removed.

This application now serves ONLY REST API endpoints.
All functionality is available through the API endpoints defined in apis.py.

For API documentation, visit:
- Swagger UI: /api/docs/
- ReDoc: /api/redoc/
- OpenAPI Schema: /api/schema/

Available API endpoints:
- /api/classroom/courses/ - Course management
- /api/classroom/classrooms/ - Classroom management
- /api/assessment/assignments/ - Assignment management
- /api/assessment/submissions/ - Submission management
- /api/assessment/quizzes/ - Quiz management
- /api/assessment/quiz-attempts/ - Quiz attempt management
- /api/content/ - Learning content management (file uploads, YouTube videos, resources)
"""

# No views in this file - all functionality available through REST APIs
# All frontend HTML templates and styling have been removed
