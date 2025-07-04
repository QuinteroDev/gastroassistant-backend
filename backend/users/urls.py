
# 4. users/urls.py - VERSIÓN LIMPIA


from django.urls import path
from .views import register_user, login_user, change_password, request_password_reset, confirm_password_reset

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('change-password/', change_password, name='change-password'),
    path('password-reset/request/', request_password_reset, name='request-password-reset'),
    path('password-reset/confirm/', confirm_password_reset, name='confirm-password-reset'),
]