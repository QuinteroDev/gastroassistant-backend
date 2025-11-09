# users/urls.py

from django.urls import path
from .views import (
    register_user, 
    login_user, 
    change_password, 
    request_password_reset, 
    confirm_password_reset,
    delete_account,
    reset_password_redirect  # 🆕 Importar la nueva vista
)

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('change-password/', change_password, name='change-password'),
    path('password-reset/request/', request_password_reset, name='request-password-reset'),
    path('password-reset/confirm/', confirm_password_reset, name='confirm-password-reset'),
    path('delete-account/', delete_account, name='delete-account'),
    path('reset-password/', reset_password_redirect, name='reset-password-redirect'),  # 🆕 Nueva ruta
]