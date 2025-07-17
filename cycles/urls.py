# cycles/urls.py
from django.urls import path
from . import views

app_name = 'cycles'

urlpatterns = [
    path('check-status/', views.check_cycle_status, name='check-status'),
    path('start-new/', views.start_new_cycle, name='start-new'),
    path('history/', views.get_cycle_history, name='history'),
    path('complete-onboarding/', views.complete_cycle_onboarding, name='complete-onboarding'),
    path('complete-setup/', views.complete_cycle_setup, name='complete-setup'),  # ← NUEVA
]