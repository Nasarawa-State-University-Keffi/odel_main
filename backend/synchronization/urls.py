from django.urls import path

from .views import DepartmentListView, FacultyListView, ProgrammeListView, ProgrammeTypeListView, SyncAllView


urlpatterns = [
    path('synchronize/sync-all', SyncAllView.as_view(), name='sync-all'),
    path('program-type/', ProgrammeTypeListView.as_view(), name='programme-type-list'),
    path('faculty/all', FacultyListView.as_view(), name='faculty-list'),
    path('faculty/search', FacultyListView.as_view(), name='faculty-search'),
    path('department/all', DepartmentListView.as_view(), name='department-list'),
    path('department/search', DepartmentListView.as_view(), name='department-search'),
    path('programme/', ProgrammeListView.as_view(), name='programme-list'),
    path('programme/search', ProgrammeListView.as_view(), name='programme-search'),
]
