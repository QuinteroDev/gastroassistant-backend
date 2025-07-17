# profiles/urls.py
from django.urls import path
from .views import UserProfileDetailView, DiagnosticTestsUpdateView, UserPhenotypeView, CompleteOnboardingView

urlpatterns = [
    # URLs existentes
    path('me/', UserProfileDetailView.as_view(), name='user-profile'),
    path('tests/update/', DiagnosticTestsUpdateView.as_view(), name='update-diagnostic-tests'),
    path('phenotype/', UserPhenotypeView.as_view(), name='user-phenotype'),
    # Nueva URL
    path('complete-onboarding/', CompleteOnboardingView.as_view(), name='complete-onboarding'),
]