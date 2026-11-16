from rest_framework.routers import DefaultRouter

from .library import (
    LibraryCourseViewSet,
    LibraryResourceViewSet,
    ResourceCategoryViewSet,
)

router = DefaultRouter()
router.register('categories', ResourceCategoryViewSet, basename='library-category')
router.register('courses', LibraryCourseViewSet, basename='library-course')
router.register('resources', LibraryResourceViewSet, basename='library-resource')
urlpatterns = router.urls
