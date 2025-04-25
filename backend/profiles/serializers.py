# profiles/serializers.py
from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    # Para mostrar el nombre de usuario, pero no permitir modificarlo aquí
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username', # Añadido para info
            'email',    # Añadido para info
            'weight_kg',
            'height_cm',
            'onboarding_complete',
            # Puedes añadir aquí los campos opcionales de pasos de onboarding si los usas
            'updated_at'
        ]
        # Hacemos onboarding_complete de solo lectura desde este endpoint.
        # Se marcará como True internamente cuando el flujo termine.
        read_only_fields = ['id', 'onboarding_complete', 'updated_at']