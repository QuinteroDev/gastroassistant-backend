# programs/serializers.py
from rest_framework import serializers
from .models import TreatmentProgram, UserProgram


class TreatmentProgramSerializer(serializers.ModelSerializer):
    """Serializer para detalles del programa de tratamiento"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = TreatmentProgram
        fields = [
            'id', 'name', 'type', 'type_display', 'description', 
            'detailed_content', 'color_primary', 'color_secondary'
        ]
        
class UserProgramSerializer(serializers.ModelSerializer):
    """Serializer para programas asignados a usuarios"""
    program = TreatmentProgramSerializer(read_only=True)
    
    class Meta:
        model = UserProgram
        fields = ['id', 'program', 'assigned_at', 'completed']