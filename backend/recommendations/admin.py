# recommendations/admin.py (continuación)
from django.contrib import admin
from .models import RecommendationType, ConditionalRecommendation, UserRecommendation

@admin.register(RecommendationType)
class RecommendationTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'is_active')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'description')

@admin.register(ConditionalRecommendation)
class ConditionalRecommendationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recommendation_type', 'condition_value', 'order', 'is_active')
    list_filter = ('recommendation_type__type', 'is_active', 'condition_value')
    search_fields = ('title', 'content', 'tools')
    list_editable = ('order', 'is_active')
    fieldsets = (
        (None, {
            'fields': ('recommendation_type', 'title', 'is_active')
        }),
        ('Contenido', {
            'fields': ('content', 'tools')
        }),
        ('Condiciones', {
            'fields': ('condition_value', 'order')
        }),
    )

@admin.register(UserRecommendation)
class UserRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_recommendation_title', 'get_recommendation_type', 
                   'is_read', 'is_prioritized', 'assigned_at', 'read_at')
    list_filter = ('is_read', 'is_prioritized', 'recommendation__recommendation_type__type')
    search_fields = ('user__username', 'user__email', 'recommendation__title')
    date_hierarchy = 'assigned_at'
    
    def get_recommendation_title(self, obj):
        return obj.recommendation.title
    get_recommendation_title.short_description = 'Recomendación'
    
    def get_recommendation_type(self, obj):
        return obj.recommendation.recommendation_type.get_type_display()
    get_recommendation_type.short_description = 'Tipo'
    get_recommendation_type.admin_order_field = 'recommendation__recommendation_type__type'
