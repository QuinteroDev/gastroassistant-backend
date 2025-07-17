# learn/urls.py
from django.urls import path
from .views import (
    LearnDashboardView,
    MarkAsReadView
)

urlpatterns = [
    path('dashboard/', LearnDashboardView.as_view(), name='learn-dashboard'),
    path('read/<int:content_id>/', MarkAsReadView.as_view(), name='mark-as-read'),
]