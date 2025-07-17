# gamification/urls.py - VERSIÓN ACTUALIZADA
from django.urls import path
from .views import (
    GamificationDashboardView,
    ProcessGamificationView,
    UserMedalsView,
    AllMedalsView,  # ← AÑADIR
    TestGamificationView
)

urlpatterns = [
    path('dashboard/', GamificationDashboardView.as_view(), name='gamification-dashboard'),
    path('process/', ProcessGamificationView.as_view(), name='process-gamification'),
    path('medals/', UserMedalsView.as_view(), name='user-medals'),
    path('all-medals/', AllMedalsView.as_view(), name='all-medals'),  # ← AÑADIR
    path('test/', TestGamificationView.as_view(), name='test-gamification'),
]