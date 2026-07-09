from django.urls import path
from .views import CurrentUserView, OIDCCallbackView, OIDCLoginView, OIDCLogoutView

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('me', CurrentUserView.as_view(), name='current-user-noslash'),
    path('login/', OIDCLoginView.as_view(), name='oidc-login'),
    path('login', OIDCLoginView.as_view(), name='oidc-login-noslash'),
    path('oidc/callback/', OIDCCallbackView.as_view(), name='oidc-callback'),
    path('oidc/callback', OIDCCallbackView.as_view(), name='oidc-callback-noslash'),
    path('logout/', OIDCLogoutView.as_view(), name='oidc-logout'),
    path('logout', OIDCLogoutView.as_view(), name='oidc-logout-noslash'),
]
