# learn/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django.forms.widgets import Textarea
from .models import (
    ContentCategory,
    StaticEducationalContent,
    UnlockableEducationalContent,
    UserContentAccess,
    UserReadingSession
)

@admin.register(ContentCategory)
class ContentCategoryAdmin(admin.ModelAdmin):
    list_display = ('icon_display', 'name', 'category_type', 'content_count', 'is_active')
    list_filter = ('category_type', 'is_active')
    search_fields = ('name', 'description')
    ordering = ('order', 'name')
    
    fieldsets = (
        ('📋 Información Básica', {
            'fields': ('name', 'category_type', 'description', 'icon'),
        }),
        ('⚙️ Configuración', {
            'fields': ('order', 'is_active'),
        }),
    )
    
    def icon_display(self, obj):
        return format_html(
            '<span style="font-size: 18px;">{}</span> {}',
            obj.icon,
            obj.name
        )
    icon_display.short_description = 'Categoría'
    
    def content_count(self, obj):
        static_count = obj.static_content.count()
        unlockable_count = obj.unlockable_content.count()
        total = static_count + unlockable_count
        
        return format_html(
            '<div style="font-size: 11px;">'
            '<div>📚 Fijo: {}</div>'
            '<div>🔒 Desbloqueado: {}</div>'
            '<div><strong>Total: {}</strong></div>'
            '</div>',
            static_count,
            unlockable_count,
            total
        )
    content_count.short_description = 'Contenidos'

@admin.register(StaticEducationalContent)
class StaticEducationalContentAdmin(admin.ModelAdmin):
    list_display = ('title_display', 'category_display', 'read_time', 'users_read', 'is_published', 'updated_at')
    list_filter = ('category', 'is_published', 'estimated_read_time', 'created_at')
    search_fields = ('title', 'content', 'tags')
    ordering = ('category', 'order', 'title')
    
    fieldsets = (
        ('📝 Contenido Principal', {
            'fields': ('title', 'summary', 'content'),
            'description': 'El contenido que verán los usuarios'
        }),
        ('📂 Organización', {
            'fields': ('category', 'order', 'tags'),
        }),
        ('🎨 Presentación', {
            'fields': ('featured_image', 'estimated_read_time'),
        }),
        ('📊 Publicación', {
            'fields': ('is_published',),
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 10, 'cols': 80})},
    }
    
    def title_display(self, obj):
        status_icon = '✅' if obj.is_published else '❌'
        return format_html(
            '{} <strong>{}</strong>',
            status_icon,
            obj.title[:50] + ('...' if len(obj.title) > 50 else '')
        )
    title_display.short_description = 'Título'
    
    def category_display(self, obj):
        return format_html(
            '{} {}',
            obj.category.icon,
            obj.category.name
        )
    category_display.short_description = 'Categoría'
    
    def read_time(self, obj):
        return format_html('📖 {} min', obj.estimated_read_time)
    read_time.short_description = 'Tiempo'
    
    def users_read(self, obj):
        count = UserContentAccess.objects.filter(
            static_content=obj,
            is_read=True
        ).count()
        
        color = '#28a745' if count > 10 else '#ffc107' if count > 0 else '#6c757d'
        return format_html(
            '<span style="color: {};">👥 {}</span>',
            color,
            count
        )
    users_read.short_description = 'Leído por'
    
    actions = ['publish_content', 'unpublish_content']
    
    def publish_content(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f'{count} contenidos publicados.')
    publish_content.short_description = "✅ Publicar contenidos"
    
    def unpublish_content(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f'{count} contenidos despublicados.')
    unpublish_content.short_description = "❌ Despublicar contenidos"

@admin.register(UnlockableEducationalContent)
class UnlockableEducationalContentAdmin(admin.ModelAdmin):
    list_display = ('title_display', 'category_display', 'unlock_info', 'users_unlocked', 'is_active')
    list_filter = ('category', 'unlock_type', 'required_level', 'is_active')
    search_fields = ('title', 'content', 'tags')
    ordering = ('category', 'order', 'title')
    
    fieldsets = (
        ('📝 Contenido Principal', {
            'fields': ('title', 'summary', 'content'),
        }),
        ('📂 Organización', {
            'fields': ('category', 'order', 'tags'),
        }),
        ('🔐 Requisitos de Desbloqueo', {
            'fields': ('unlock_type', 'required_medal', 'required_points', 'required_level', 'required_cycle'),
            'description': 'Define cuándo se desbloquea este contenido'
        }),
        ('🎨 Presentación', {
            'fields': ('featured_image', 'estimated_read_time'),
        }),
        ('⚙️ Estado', {
            'fields': ('is_active',),
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 10, 'cols': 80})},
    }
    
    def title_display(self, obj):
        status_icon = '✅' if obj.is_active else '❌'
        return format_html(
            '{} 🔒 <strong>{}</strong>',
            status_icon,
            obj.title[:40] + ('...' if len(obj.title) > 40 else '')
        )
    title_display.short_description = 'Título'
    
    def category_display(self, obj):
        return format_html(
            '{} {}',
            obj.category.icon,
            obj.category.name
        )
    category_display.short_description = 'Categoría'
    
    def unlock_info(self, obj):
        if obj.unlock_type == 'MEDAL' and obj.required_medal:
            return format_html(
                '<div style="font-size: 11px;">'
                '<div>🏆 Medalla</div>'
                '<div>{} {}</div>'
                '</div>',
                obj.required_medal.icon,
                obj.required_medal.name[:20]
            )
        elif obj.unlock_type == 'POINTS':
            return format_html(
                '<div style="font-size: 11px;">'
                '<div>🎯 Puntos</div>'
                '<div>{} pts</div>'
                '</div>',
                obj.required_points
            )
        elif obj.unlock_type == 'LEVEL':
            level_icons = {
                'NOVATO': '🟤', 'BRONCE': '🥉', 'PLATA': '🥈',
                'ORO': '🥇', 'PLATINO': '💎', 'MAESTRO': '👑'
            }
            icon = level_icons.get(obj.required_level, '❓')
            return format_html(
                '<div style="font-size: 11px;">'
                '<div>🏆 Nivel</div>'
                '<div>{} {}</div>'
                '</div>',
                icon,
                obj.required_level
            )
        elif obj.unlock_type == 'CYCLE':
            return format_html(
                '<div style="font-size: 11px;">'
                '<div>📅 Ciclo</div>'
                '<div>Ciclo {}</div>'
                '</div>',
                obj.required_cycle
            )
        return '❓ No definido'
    unlock_info.short_description = 'Desbloqueo'
    
    def users_unlocked(self, obj):
        count = UserContentAccess.objects.filter(
            unlockable_content=obj
        ).count()
        
        color = '#28a745' if count > 5 else '#ffc107' if count > 0 else '#6c757d'
        return format_html(
            '<span style="color: {};">🔓 {}</span>',
            color,
            count
        )
    users_unlocked.short_description = 'Desbloqueado'

@admin.register(UserContentAccess)
class UserContentAccessAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'content_display', 'content_type', 'progress_display', 'last_read_display')
    list_filter = ('is_read', 'is_favorite', 'unlocked_at')
    search_fields = ('user__username', 'static_content__title', 'unlockable_content__title')
    readonly_fields = ('unlocked_at', 'first_read_at', 'last_read_at')
    ordering = ('-unlocked_at',)
    
    def user_display(self, obj):
        return format_html('<strong>{}</strong>', obj.user.username)
    user_display.short_description = 'Usuario'
    
    def content_display(self, obj):
        if obj.static_content:
            return format_html('📚 {}', obj.static_content.title[:40])
        elif obj.unlockable_content:
            return format_html('🔒 {}', obj.unlockable_content.title[:40])
        return '❓ Sin título'
    content_display.short_description = 'Contenido'
    
    def content_type(self, obj):
        if obj.static_content:
            return '📚 Fijo'
        elif obj.unlockable_content:
            return '🔓 Desbloqueado'
        return '❓'
    content_type.short_description = 'Tipo'
    
    def progress_display(self, obj):
        if obj.is_read:
            return format_html(
                '<div style="color: #28a745;">'
                '✅ Leído ({}%)<br>'
                '<small>🔄 {} veces</small>'
                '</div>',
                obj.read_percentage,
                obj.read_count
            )
        else:
            color = '#ffc107' if obj.read_percentage > 0 else '#6c757d'
            return format_html(
                '<div style="color: {};">'
                '📖 {}%'
                '</div>',
                color,
                obj.read_percentage
            )
    progress_display.short_description = 'Progreso'
    
    def last_read_display(self, obj):
        if obj.last_read_at:
            return obj.last_read_at.strftime('%d/%m/%Y')
        return '❌ Nunca'
    last_read_display.short_description = 'Última lectura'

@admin.register(UserReadingSession)
class UserReadingSessionAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'content_display', 'session_date', 'time_spent', 'completed')
    list_filter = ('completed_reading', 'session_start')
    search_fields = ('user__username',)
    readonly_fields = ('session_start', 'session_end')
    ordering = ('-session_start',)
    
    def user_display(self, obj):
        return format_html('<strong>{}</strong>', obj.user.username)
    user_display.short_description = 'Usuario'
    
    def content_display(self, obj):
        return obj.content_access.content_title[:50]
    content_display.short_description = 'Contenido'
    
    def session_date(self, obj):
        return obj.session_start.strftime('%d/%m/%Y %H:%M')
    session_date.short_description = 'Fecha'
    
    def time_spent(self, obj):
        minutes = obj.time_spent_seconds // 60
        seconds = obj.time_spent_seconds % 60
        return f'{minutes}m {seconds}s'
    time_spent.short_description = 'Tiempo'
    
    def completed(self, obj):
        if obj.completed_reading:
            return format_html('<span style="color: #28a745;">✅ Completado</span>')
        else:
            return format_html('<span style="color: #6c757d;">📖 Parcial ({}%)</span>', obj.scroll_percentage)
    completed.short_description = 'Estado'

# Personalización adicional del admin
admin.site.site_header = "Gastro Assistant - Gestión de Contenidos"
admin.site.index_title = "Panel de Contenidos Educativos"