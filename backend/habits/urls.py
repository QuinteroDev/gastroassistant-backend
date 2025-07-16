from django.urls import path
from .views import (
    UserHabitTrackersView,
    HabitLogView,
    HabitLogsHistoryView,
    DailyNoteView,  
    CheckAllHabitsCompletedView,
    DailyNotesSummaryView,
    DailyNotesMonthlyView
)

urlpatterns = [
    path('', UserHabitTrackersView.as_view(), name='user-habit-trackers'),
    path('my-trackers/', UserHabitTrackersView.as_view(), name='user-habit-trackers-alt'),
    path('log/', HabitLogView.as_view(), name='log-habit'),
    path('<int:habit_id>/history/', HabitLogsHistoryView.as_view(), name='habit-logs-history'),
    path('daily-notes/', DailyNoteView.as_view(), name='daily-notes'),  # Nueva
    path('check-completion/', CheckAllHabitsCompletedView.as_view(), name='check-completion'),  # Nueva
    path('daily-notes/summary/', DailyNotesSummaryView.as_view(), name='daily-notes-summary'),
    path('daily-notes/monthly/', DailyNotesMonthlyView.as_view(), name='daily-notes-monthly'),
]