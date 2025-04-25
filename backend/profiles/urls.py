# profiles/urls.py
from django.urls import path
from .views import UserProfileDetailView

urlpatterns = [
    # Endpoint para obtener/actualizar el perfil del usuario logueado
    path('me/', UserProfileDetailView.as_view(), name='user_profile_me'),
    # 'me' es una convención común para referirse al recurso del propio usuario
]