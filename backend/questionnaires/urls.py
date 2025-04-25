# questionnaires/urls.py
from django.urls import path
from .views import QuestionnaireDetailView, SubmitQuestionnaireAnswersView

app_name = 'questionnaires'

urlpatterns = [
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='detail'),
    path('<int:pk>/submit/', SubmitQuestionnaireAnswersView.as_view(), name='submit'),
]