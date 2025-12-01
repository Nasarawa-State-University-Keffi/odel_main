from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyCategoryViewSet, DegreeTypeViewSet, ProgrammeViewSet

router = DefaultRouter()
router.register(r'categories', StudyCategoryViewSet, basename='study-category')
router.register(r'degree-types', DegreeTypeViewSet, basename='degree-type')
router.register(r'programmes', ProgrammeViewSet, basename='programme')

urlpatterns = [
    path('', include(router.urls)),
]
