# cycles/admin.py
from django.contrib import admin
from .models import UserCycle, CycleSnapshot, CycleHabitAssignment

@admin.register(UserCycle)
class UserCycleAdmin(admin.ModelAdmin):
    list_display = ['user', 'cycle_number', 'status', 'start_date', 'end_date', 'phenotype']
    list_filter = ['status', 'phenotype']
    search_fields = ['user__username']

@admin.register(CycleSnapshot)
class CycleSnapshotAdmin(admin.ModelAdmin):
    list_display = ['cycle', 'bmi', 'created_at']

@admin.register(CycleHabitAssignment)
class CycleHabitAssignmentAdmin(admin.ModelAdmin):
    list_display = ['cycle', 'habit', 'initial_score', 'priority_order']