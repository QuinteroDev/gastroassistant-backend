from django.urls import path
from .views import register_user, login_user, change_password

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('change-password/', change_password, name='change-password'),
]