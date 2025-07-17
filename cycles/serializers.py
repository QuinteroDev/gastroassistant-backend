# cycles/serializers.py
from rest_framework import serializers
from .models import UserCycle, CycleSnapshot, CycleHabitAssignment

class CycleHabitAssignmentSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source='habit.get_habit_type_display', read_only=True)
    habit_type = serializers.CharField(source='habit.habit_type', read_only=True)
    
    class Meta:
        model = CycleHabitAssignment
        fields = ['habit_name', 'habit_type', 'initial_score', 'priority_order']

class CycleSerializer(serializers.ModelSerializer):
    days_remaining = serializers.ReadOnlyField()
    days_elapsed = serializers.ReadOnlyField()
    assigned_habits = CycleHabitAssignmentSerializer(
        source='cyclehabitassignment_set', 
        many=True, 
        read_only=True
    )
    
    class Meta:
        model = UserCycle
        fields = [
            'id', 'cycle_number', 'start_date', 'end_date', 
            'status', 'gerdq_score', 'rsi_score', 'phenotype',
            'days_remaining', 'days_elapsed', 'assigned_habits',
            'onboarding_completed_at'
        ]