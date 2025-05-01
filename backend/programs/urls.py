# programs/urls.py
from django.urls import path
from .views import UserProgramView

urlpatterns = [
    path('my-program/', UserProgramView.as_view(), name='user-program'),
]