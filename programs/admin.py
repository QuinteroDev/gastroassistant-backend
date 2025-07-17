# programs/admin.py
from django.contrib import admin
from .models import TreatmentProgram, UserProgram

@admin.register(TreatmentProgram)
class TreatmentProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'is_active', 'created_at')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'description')

@admin.register(UserProgram)
class UserProgramAdmin(admin.ModelAdmin):
    list_display = ('user', 'program', 'assigned_at', 'completed')
    list_filter = ('completed', 'program__type')
    search_fields = ('user__username', 'user__email', 'program__name')
    raw_id_fields = ('user', 'program')

