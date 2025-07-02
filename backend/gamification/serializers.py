# gamification/serializers.py
from rest_framework import serializers
from .models import UserLevel, Medal, UserMedal, DailyPoints

class UserLevelSerializer(serializers.ModelSerializer):
    """Serializer para el nivel del usuario"""
    cycle_number = serializers.SerializerMethodField()
    level_display = serializers.CharField(source='get_current_level_display', read_only=True)
    
    class Meta:
        model = UserLevel
        fields = [
            'current_level',
            'level_display', 
            'current_cycle_points',
            'total_points_all_time',
            'current_streak',
            'longest_streak',
            'last_activity_date',
            'cycle_number'
        ]
    
    def get_cycle_number(self, obj):
        return obj.current_cycle.cycle_number if obj.current_cycle else None

class MedalSerializer(serializers.ModelSerializer):
    """Serializer básico para medallas"""
    
    class Meta:
        model = Medal
        fields = [
            'id',
            'name',
            'description', 
            'icon',
            'required_points',
            'required_level',
            'required_cycle_number'
        ]

class UserMedalSerializer(serializers.ModelSerializer):
    """Serializer para medallas ganadas por el usuario"""
    medal = MedalSerializer(read_only=True)
    cycle_number = serializers.SerializerMethodField()
    
    class Meta:
        model = UserMedal
        fields = [
            'id',
            'medal',
            'earned_at',
            'points_when_earned',
            'level_when_earned',
            'cycle_number'
        ]
    
    def get_cycle_number(self, obj):
        return obj.cycle_earned.cycle_number if obj.cycle_earned else None

class DailyPointsSerializer(serializers.ModelSerializer):
    """Serializer para puntos diarios (si se necesita)"""
    
    class Meta:
        model = DailyPoints
        fields = [
            'date',
            'total_points',
            'habit_points',
            'bonus_completion',
            'bonus_streak',
            'habits_completed',
            'habits_total',
            'streak_on_date'
        ]