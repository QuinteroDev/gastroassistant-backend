# habits/serializers.py
from rest_framework import serializers
from .models import HabitTracker, HabitLog, HabitStreak
from questionnaires.models import HabitQuestion
from questionnaires.serializers import HabitQuestionSerializer

class HabitStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitStreak
        fields = ['current_streak', 'longest_streak', 'last_log_date']

class HabitTrackerSerializer(serializers.ModelSerializer):
    habit = HabitQuestionSerializer(read_only=True)
    streak = HabitStreakSerializer(read_only=True)
    
    class Meta:
        model = HabitTracker
        fields = ['id', 'habit', 'is_active', 'is_promoted', 
                 'target_score', 'current_score', 'streak']

class HabitLogSerializer(serializers.ModelSerializer):
    tracker_id = serializers.PrimaryKeyRelatedField(
        source='tracker',
        queryset=HabitTracker.objects.all()
    )
    habit_id = serializers.PrimaryKeyRelatedField(
        source='tracker.habit',
        read_only=True
    )
    habit_type = serializers.CharField(source='tracker.habit.habit_type', read_only=True)
    
    class Meta:
        model = HabitLog
        fields = ['id', 'tracker_id', 'habit_id', 'habit_type', 'date', 
                 'completion_level', 'notes', 'logged_at']