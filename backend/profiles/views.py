# profiles/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener (GET) y actualizar (PUT/PATCH)
    el perfil del usuario autenticado.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated] # Solo usuarios logueados

    def get_object(self):
        # Asegura que siempre se obtenga el perfil DEL USUARIO LOGUEADO
        # Asume que la signal ha creado el perfil al registrarse.
        # Si hay algún caso donde no exista, habría que manejarlo (get_or_create).
        return self.request.user.profile