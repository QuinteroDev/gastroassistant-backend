# questionnaires/urls.py (Actualizar para incluir hábitos)
from django.urls import path
from .views import (
    QuestionnaireDetailView,
    SubmitQuestionnaireAnswersView,
    UserQuestionnaireCompletionsView,
    HabitQuestionsView,
    SubmitHabitQuestionnaireView
)

urlpatterns = [
    # URLs existentes
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    path('<int:pk>/submit/', SubmitQuestionnaireAnswersView.as_view(), name='questionnaire-submit'),
    path('completions/me/', UserQuestionnaireCompletionsView.as_view(), name='my-questionnaire-completions'),
    
    # Nuevos endpoints para hábitos
    path('habits/', HabitQuestionsView.as_view(), name='habit-questions'),
    path('habits/submit/', SubmitHabitQuestionnaireView.as_view(), name='submit-habits'),
]