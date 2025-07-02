# gamification/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django.forms.widgets import Textarea
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import UserLevel, Medal, UserMedal, DailyPoints, CycleGamificationSummary

@admin.register(Medal)
class MedalAdmin(admin.ModelAdmin):
    list_display = ('icon_display', 'name', 'cycle_info', 'points_required', 'level_required', 'users_earned', 'is_active')
    list_filter = ('required_level', 'required_cycle_number', 'is_active', 'week_number')
    search_fields = ('name', 'description')
    ordering = ('required_cycle_number', 'week_number', 'order')
    
    fieldsets = (
        ('📋 Información Básica', {
            'fields': ('name', 'description', 'icon'),
            'description': 'Información principal de la medalla'
        }),
        ('🎯 Requisitos', {
            'fields': ('required_points', 'required_level', 'required_cycle_number'),
            'description': 'Cuándo se puede obtener esta medalla'
        }),
        ('📅 Organización', {
            'fields': ('week_number', 'order'),
            'description': 'Orden dentro del ciclo'
        }),
        ('⚙️ Estado', {
            'fields': ('is_active',),
            'description': 'Control de activación'
        }),
    )
    
    def icon_display(self, obj):
        """Muestra el icono con el nombre"""
        return format_html(
            '<span style="font-size: 18px;">{}</span> {}',
            obj.icon,
            obj.name[:20] + ('...' if len(obj.name) > 20 else '')
        )
    icon_display.short_description = 'Medalla'
    
    def cycle_info(self, obj):
        """Información del ciclo de forma visual"""
        return format_html(
            '<div style="font-size: 11px;">'
            '<div>📅 Ciclo {}</div>'
            '<div>🗓️ Semana {}</div>'
            '</div>',
            obj.required_cycle_number,
            obj.week_number
        )
    cycle_info.short_description = 'Ciclo/Semana'
    
    def points_required(self, obj):
        """Puntos requeridos con formato visual"""
        return format_html(
            '<span style="font-weight: bold; color: {};">{} pts</span>',
            '#28a745' if obj.required_points <= 1000 else '#ffc107' if obj.required_points <= 3000 else '#dc3545',
            obj.required_points
        )
    points_required.short_description = 'Puntos'
    
    def level_required(self, obj):
        """Nivel requerido con emoji"""
        level_icons = {
            'NOVATO': '🟤',
            'BRONCE': '🥉',
            'PLATA': '🥈',
            'ORO': '🥇',
            'PLATINO': '💎',
            'MAESTRO': '👑'
        }
        icon = level_icons.get(obj.required_level, '❓')
        return format_html('{} {}', icon, obj.required_level)
    level_required.short_description = 'Nivel'
    
    def users_earned(self, obj):
        """Cantidad de usuarios que han ganado esta medalla"""
        count = UserMedal.objects.filter(medal=obj).count()
        color = '#28a745' if count > 10 else '#ffc107' if count > 0 else '#6c757d'
        return format_html(
            '<span style="color: {}; font-weight: bold;">👥 {}</span>',
            color,
            count
        )
    users_earned.short_description = 'Usuarios'
    
    actions = ['activate_medals', 'deactivate_medals', 'duplicate_medal']
    
    def activate_medals(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} medallas activadas.')
    activate_medals.short_description = "✅ Activar medallas seleccionadas"
    
    def deactivate_medals(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} medallas desactivadas.')
    deactivate_medals.short_description = "❌ Desactivar medallas seleccionadas"

@admin.register(UserLevel)
class UserLevelAdmin(admin.ModelAdmin):
    list_display = ('user_info', 'level_display', 'cycle_info', 'points_display', 'streak_display', 'last_activity')
    list_filter = ('current_level', 'current_cycle__cycle_number')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-current_cycle_points', 'current_level')
    
    fieldsets = (
        ('👤 Usuario', {
            'fields': ('user',),
        }),
        ('🎮 Gamificación', {
            'fields': ('current_level', 'current_cycle', 'current_cycle_points', 'total_points_all_time'),
        }),
        ('🔥 Rachas', {
            'fields': ('current_streak', 'longest_streak', 'last_activity_date'),
        }),
        ('📅 Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def user_info(self, obj):
        """Información del usuario"""
        return format_html(
            '<div>'
            '<strong>{}</strong><br>'
            '<small style="color: #6c757d;">{}</small>'
            '</div>',
            obj.user.username,
            obj.user.email
        )
    user_info.short_description = 'Usuario'
    
    def level_display(self, obj):
        """Nivel con emoji"""
        level_icons = {
            'NOVATO': '🟤',
            'BRONCE': '🥉',
            'PLATA': '🥈',
            'ORO': '🥇',
            'PLATINO': '💎',
            'MAESTRO': '👑'
        }
        icon = level_icons.get(obj.current_level, '❓')
        return format_html('{} {}', icon, obj.current_level)
    level_display.short_description = 'Nivel'
    
    def cycle_info(self, obj):
        """Información del ciclo"""
        if obj.current_cycle:
            return format_html(
                '<div style="font-size: 11px;">'
                '<div>📅 Ciclo {}</div>'
                '<div>📊 {}</div>'
                '</div>',
                obj.current_cycle.cycle_number,
                obj.current_cycle.status
            )
        return '❌ Sin ciclo'
    cycle_info.short_description = 'Ciclo'
    
    def points_display(self, obj):
        """Puntos con progreso visual"""
        cycle_points = obj.current_cycle_points
        total_points = obj.total_points_all_time
        
        return format_html(
            '<div>'
            '<div style="font-weight: bold;">🎯 {} pts</div>'
            '<div style="font-size: 11px; color: #6c757d;">Total: {} pts</div>'
            '</div>',
            cycle_points,
            total_points
        )
    points_display.short_description = 'Puntos'
    
    def streak_display(self, obj):
        """Rachas con iconos"""
        return format_html(
            '<div>'
            '<div>🔥 {} días</div>'
            '<div style="font-size: 11px; color: #6c757d;">Mejor: {} días</div>'
            '</div>',
            obj.current_streak,
            obj.longest_streak
        )
    streak_display.short_description = 'Racha'
    
    def last_activity(self, obj):
        """Última actividad"""
        if obj.last_activity_date:
            return obj.last_activity_date.strftime('%d/%m/%Y')
        return '❌ Nunca'
    last_activity.short_description = 'Última actividad'

@admin.register(UserMedal)
class UserMedalAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'medal_display', 'cycle_earned_display', 'points_when_earned', 'earned_date')
    list_filter = ('medal__required_level', 'cycle_earned__cycle_number', 'earned_at')
    search_fields = ('user__username', 'medal__name')
    readonly_fields = ('earned_at',)
    ordering = ('-earned_at',)
    
    def user_display(self, obj):
        return format_html('<strong>{}</strong>', obj.user.username)
    user_display.short_description = 'Usuario'
    
    def medal_display(self, obj):
        return format_html(
            '<span style="font-size: 16px;">{}</span> {}',
            obj.medal.icon,
            obj.medal.name
        )
    medal_display.short_description = 'Medalla'
    
    def cycle_earned_display(self, obj):
        return format_html('📅 Ciclo {}', obj.cycle_earned.cycle_number)
    cycle_earned_display.short_description = 'Ciclo'
    
    def earned_date(self, obj):
        return obj.earned_at.strftime('%d/%m/%Y %H:%M')
    earned_date.short_description = 'Fecha'

@admin.register(DailyPoints)
class DailyPointsAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'date', 'total_points', 'habits_progress', 'streak_info', 'cycle_display')
    list_filter = ('date', 'cycle__cycle_number')
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)
    ordering = ('-date', 'user__username')
    
    fieldsets = (
        ('📋 Información', {
            'fields': ('user', 'cycle', 'date'),
        }),
        ('🎯 Puntos Detallados', {
            'fields': ('habit_points', 'bonus_completion', 'bonus_streak', 'bonus_promoted_habit', 'total_points'),
        }),
        ('📊 Hábitos', {
            'fields': ('habits_completed', 'habits_total', 'streak_on_date'),
        }),
        ('📅 Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )
    
    def user_display(self, obj):
        return format_html('<strong>{}</strong>', obj.user.username)
    user_display.short_description = 'Usuario'
    
    def habits_progress(self, obj):
        if obj.habits_total > 0:
            percentage = (obj.habits_completed / obj.habits_total) * 100
            color = '#28a745' if percentage == 100 else '#ffc107' if percentage >= 50 else '#dc3545'
            return format_html(
                '<div style="color: {}; font-weight: bold;">'
                '{}/{} ({}%)'
                '</div>',
                color,
                obj.habits_completed,
                obj.habits_total,
                int(percentage)
            )
        return '❌ Sin hábitos'
    habits_progress.short_description = 'Hábitos'
    
    def streak_info(self, obj):
        return format_html('🔥 {} días', obj.streak_on_date)
    streak_info.short_description = 'Racha'
    
    def cycle_display(self, obj):
        return format_html('📅 Ciclo {}', obj.cycle.cycle_number)
    cycle_display.short_description = 'Ciclo'

# Personalización del admin site
admin.site.site_header = "Gastro Assistant - Gamificación"
admin.site.site_title = "Gamificación Admin"
admin.site.index_title = "Panel de Control de Gamificación"

# Configuración adicional para mejor experiencia
class GamificationAdminConfig:
    """Configuración global para el admin de gamificación"""
    
    def __init__(self):
        # Añadir CSS personalizado
        admin.site.media = {
            'css': {
                'all': ('admin/css/gamification_admin.css',)
            }
        }
    
    @staticmethod
    def get_dashboard_stats():
        """Estadísticas para mostrar en dashboard personalizado"""
        from django.contrib.auth.models import User
        
        return {
            'total_users': UserLevel.objects.count(),
            'active_medals': Medal.objects.filter(is_active=True).count(),
            'medals_earned_today': UserMedal.objects.filter(
                earned_at__date=timezone.now().date()
            ).count(),
            'top_level_distribution': UserLevel.objects.values('current_level').annotate(
                count=models.Count('id')
            ).order_by('-count')
        }