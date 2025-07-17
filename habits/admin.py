# habits/admin.py
from django.contrib import admin
from .models import HabitTracker, HabitLog, HabitStreak

class HabitLogInline(admin.TabularInline):
    model = HabitLog
    extra = 1
    max_num = 10
    ordering = ('-date',)

class HabitStreakInline(admin.StackedInline):
    model = HabitStreak
    can_delete = False
    max_num = 1

@admin.register(HabitTracker)
class HabitTrackerAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_habit_type', 'is_active', 'is_promoted', 
                   'current_score', 'target_score', 'get_current_streak')
    list_filter = ('is_active', 'is_promoted', 'habit__habit_type')
    search_fields = ('user__username', 'user__email')
    inlines = [HabitStreakInline, HabitLogInline]
    
    def get_habit_type(self, obj):
        return obj.habit.get_habit_type_display()
    get_habit_type.short_description = 'Tipo de hábito'
    get_habit_type.admin_order_field = 'habit__habit_type'
    
    def get_current_streak(self, obj):
        try:
            return obj.streak.current_streak
        except HabitStreak.DoesNotExist:
            return 0
    get_current_streak.short_description = 'Racha actual'

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('get_user', 'get_habit_type', 'date', 'completion_level', 'logged_at')
    list_filter = ('completion_level', 'tracker__habit__habit_type', 'date')
    search_fields = ('tracker__user__username', 'tracker__user__email', 'notes')
    date_hierarchy = 'date'
    
    def get_user(self, obj):
        return obj.tracker.user
    get_user.short_description = 'Usuario'
    get_user.admin_order_field = 'tracker__user'
    
    def get_habit_type(self, obj):
        return obj.tracker.habit.get_habit_type_display()
    get_habit_type.short_description = 'Tipo de hábito'
    get_habit_type.admin_order_field = 'tracker__habit__habit_type'

@admin.register(HabitStreak)
class HabitStreakAdmin(admin.ModelAdmin):
    list_display = ('get_user', 'get_habit_type', 'current_streak', 'longest_streak', 'last_log_date')
    list_filter = ('tracker__habit__habit_type',)
    search_fields = ('tracker__user__username', 'tracker__user__email')
    
    def get_user(self, obj):
        return obj.tracker.user
    get_user.short_description = 'Usuario'
    get_user.admin_order_field = 'tracker__user'
    
    def get_habit_type(self, obj):
        return obj.tracker.habit.get_habit_type_display()
    get_habit_type.short_description = 'Tipo de hábito'
    get_habit_type.admin_order_field = 'tracker__habit__habit_type'