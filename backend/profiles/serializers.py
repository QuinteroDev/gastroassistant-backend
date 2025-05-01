# profiles/serializers.py
from rest_framework import serializers
from .models import UserProfile

from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'weight_kg',
            'height_cm',
            'has_hernia',
            'has_endoscopy',
            'endoscopy_result',
            'has_ph_monitoring',
            'ph_monitoring_result',
            'phenotype',
            'scenario',
            'onboarding_complete',
            'updated_at'
        ]
        read_only_fields = ['id', 'onboarding_complete', 'phenotype', 'scenario', 'updated_at']
    
    def update(self, instance, validated_data):
        """Actualiza el perfil y también campos relacionados en User si se proporcionan"""
        # Extraer datos del User si están presentes
        user_data = validated_data.pop('user', None)
        
        # Actualizar campos del perfil
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Actualizar campos del User si hay datos
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        
        # Guardar el perfil actualizado
        instance.save()
        return instance