# habits/urls.py
from django.urls import path
from .views import (
    UserHabitTrackersView,
    HabitLogView,
    HabitLogsHistoryView
)

urlpatterns = [
    path('', UserHabitTrackersView.as_view(), name='user-habit-trackers'),
    path('log/', HabitLogView.as_view(), name='log-habit'),
    path('<int:habit_id>/history/', HabitLogsHistoryView.as_view(), name='habit-logs-history'),
]