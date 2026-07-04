"""
LMS Service URLs - API-only Backend

This is an API-only Learning Management System.
All frontend has been removed. Use REST API endpoints for all operations.

Available API Documentation:
- Swagger UI: /api/docs/
- ReDoc: /api/redoc/
- OpenAPI Schema: /api/schema/

Available API Endpoints:
- /api/courses/* - Course management APIs (courses, enrollments)
- /api/assessment/* - Assessment APIs (assignments, submissions, quizzes, quiz attempts)
- /api/content/* - Learning content management APIs (file storage, YouTube videos)
- /admin/ - Django admin panel
"""
from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('portal_auth.urls')),
    
    # Courses APIs
    path('', include('courses.urls')),
    
    # Student APIs
    path('api/student/assessment/', include('assessment.student_urls')),
    
    # Staff APIs
    path('api/staff/assessment/', include('assessment.staff_urls')),

    
    # Learning Content APIs
    path('api/content/', include('resource.content.urls')),

    # Dashboard endpoint urls
    path('api/dashboard/', include('dashboard.urls')),

    # Notifications & Email Management
    path('api/notifications/', include('notifications.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
