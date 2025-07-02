# learn/serializers.py
from rest_framework import serializers
from .models import (
    ContentCategory,
    StaticEducationalContent,
    UnlockableEducationalContent,
    UserContentAccess
)

class ContentCategorySerializer(serializers.ModelSerializer):
    """Serializer básico para categorías"""
    
    class Meta:
        model = ContentCategory
        fields = ['id', 'name', 'icon', 'category_type']

class StaticContentSerializer(serializers.ModelSerializer):
    """Serializer para contenido estático"""
    category = ContentCategorySerializer(read_only=True)
    
    class Meta:
        model = StaticEducationalContent
        fields = [
            'id', 
            'title', 
            'content', 
            'summary', 
            'category',
            'estimated_read_time',
            'created_at'
        ]

class UnlockableContentSerializer(serializers.ModelSerializer):
    """Serializer para contenido desbloqueado"""
    category = ContentCategorySerializer(read_only=True)
    unlock_info = serializers.SerializerMethodField()
    
    class Meta:
        model = UnlockableEducationalContent
        fields = [
            'id', 
            'title', 
            'content', 
            'summary', 
            'category',
            'unlock_info',
            'estimated_read_time',
            'created_at'
        ]
    
    def get_unlock_info(self, obj):
        """Información simple de cómo se desbloqueó"""
        if obj.unlock_type == 'MEDAL' and obj.required_medal:
            return f"Medalla: {obj.required_medal.name}"
        elif obj.unlock_type == 'POINTS':
            return f"Puntos: {obj.required_points}"
        elif obj.unlock_type == 'LEVEL':
            return f"Nivel: {obj.required_level}"
        elif obj.unlock_type == 'CYCLE':
            return f"Ciclo: {obj.required_cycle}"
        return "Desbloqueado"

class UserContentAccessSerializer(serializers.ModelSerializer):
    """Serializer para contenido accesible al usuario"""
    content_data = serializers.SerializerMethodField()
    content_type = serializers.SerializerMethodField()
    
    class Meta:
        model = UserContentAccess
        fields = [
            'id',
            'content_data',
            'content_type',
            'unlocked_at',
            'is_read',
            'read_percentage',
            'read_count'
        ]
    
    def get_content_data(self, obj):
        """Datos del contenido (estático o desbloqueado)"""
        if obj.static_content:
            return StaticContentSerializer(obj.static_content).data
        elif obj.unlockable_content:
            return UnlockableContentSerializer(obj.unlockable_content).data
        return None
    
    def get_content_type(self, obj):
        """Tipo de contenido"""
        if obj.static_content:
            return 'static'
        elif obj.unlockable_content:
            return 'unlocked'
        return 'unknown'

class LockedContentPreviewSerializer(serializers.Serializer):
    """Serializer para preview de contenido bloqueado"""
    title = serializers.CharField()
    summary = serializers.CharField()
    unlock_requirement = serializers.CharField()
    points_needed = serializers.IntegerField()