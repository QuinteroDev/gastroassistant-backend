# questionnaires/urls.py - Añadir las nuevas rutas para factores clínicos

from django.urls import path
from .views import (
    QuestionnaireDetailView,
    SubmitQuestionnaireAnswersView,
    UserQuestionnaireCompletionsView,
    HabitQuestionsView,
    SubmitHabitQuestionnaireView,
    ClinicalFactorsQuestionnaireView,  # NUEVO
    SubmitClinicalFactorsView          # NUEVO
)

urlpatterns = [
    # URLs existentes
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    path('<int:pk>/submit/', SubmitQuestionnaireAnswersView.as_view(), name='questionnaire-submit'),
    path('completions/me/', UserQuestionnaireCompletionsView.as_view(), name='my-questionnaire-completions'),
    
    # URLs para hábitos
    path('habits/', HabitQuestionsView.as_view(), name='habit-questions'),
    path('habits/submit/', SubmitHabitQuestionnaireView.as_view(), name='submit-habits'),
    
    # NUEVAS URLs para factores clínicos
    path('clinical-factors/', ClinicalFactorsQuestionnaireView.as_view(), name='clinical-factors'),
    path('clinical-factors/submit/', SubmitClinicalFactorsView.as_view(), name='submit-clinical-factors'),
]