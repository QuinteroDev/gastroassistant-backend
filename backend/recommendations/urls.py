# recommendations/urls.py
from django.urls import path
from .views import (
    UserRecommendationsView,
    PrioritizedRecommendationsView,
    UserRecommendationDetailView,
    RegenerateRecommendationsView
)

urlpatterns = [
    path('', UserRecommendationsView.as_view(), name='user-recommendations'),
    path('prioritized/', PrioritizedRecommendationsView.as_view(), name='prioritized-recommendations'),
    path('<int:pk>/', UserRecommendationDetailView.as_view(), name='recommendation-detail'),
    path('regenerate/', RegenerateRecommendationsView.as_view(), name='regenerate-recommendations'),
]