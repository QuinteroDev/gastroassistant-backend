# recommendations/serializers.py
from rest_framework import serializers
from .models import RecommendationType, ConditionalRecommendation, UserRecommendation

class RecommendationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationType
        fields = ['id', 'type', 'name', 'description']

class ConditionalRecommendationSerializer(serializers.ModelSerializer):
    recommendation_type = RecommendationTypeSerializer(read_only=True)
    
    class Meta:
        model = ConditionalRecommendation
        fields = ['id', 'recommendation_type', 'title', 'content',
                 'condition_value', 'tools', 'tools_title', 'order', 'icon_type']

class UserRecommendationSerializer(serializers.ModelSerializer):
    recommendation = ConditionalRecommendationSerializer(read_only=True)
    
    class Meta:
        model = UserRecommendation
        fields = ['id', 'recommendation', 'is_read', 'is_prioritized', 'assigned_at']

class UserRecommendationDetailSerializer(serializers.ModelSerializer):
    recommendation = ConditionalRecommendationSerializer(read_only=True)
    
    class Meta:
        model = UserRecommendation
        fields = ['id', 'recommendation', 'is_read', 'is_prioritized', 
                 'assigned_at', 'read_at']
        read_only_fields = ['id', 'recommendation', 'is_prioritized', 
                          'assigned_at', 'read_at']
    
    def update(self, instance, validated_data):
        # Si se marca como leída, actualizar la fecha de lectura
        if validated_data.get('is_read', False) and not instance.is_read:
            from django.utils import timezone
            instance.read_at = timezone.now()
        
        return super().update(instance, validated_data)