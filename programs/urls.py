# programs/urls.py
from django.urls import path
from .views import UserProgramView, GenerateProgramView

urlpatterns = [
    path('my-program/', UserProgramView.as_view(), name='user-program'),
    path('generate/', GenerateProgramView.as_view(), name='generate-program'),

]