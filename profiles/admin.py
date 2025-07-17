# profiles/admin.py
from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'weight_kg', 'height_cm', 'onboarding_complete', 'updated_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('onboarding_complete',)