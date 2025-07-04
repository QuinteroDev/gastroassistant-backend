# learn/admin.py - VERSIÓN SÚPER SIMPLE PARA ALEJANDRO
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

# ========================================
# 📚 CONTENIDO GENERAL (Para todos los usuarios)
# ========================================
@admin.register(StaticEducationalContent)
class ContenidoGeneralAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'tiempo_lectura', 'publicado', 'fecha_creacion')
    list_filter = ('category', 'is_published', 'created_at')
    search_fields = ('title', 'content')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('✏️ ESCRIBIR ARTÍCULO', {
            'fields': ('title', 'content'),
            'description': '👇 Aquí escribes el título, resumen y contenido completo del artículo'
        }),
        ('📂 CONFIGURACIÓN', {
            'fields': ('category', 'estimated_read_time', 'is_published'),
            'description': '👇 Selecciona categoría, tiempo estimado y si quieres publicarlo ya'
        }),
    )
    
    # Hacer el campo de contenido más grande
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 15, 'cols': 100})},
    }
    
    # Nombres más claros para Alejandro
    def titulo(self, obj):
        if obj.is_published:
            return f"✅ {obj.title}"
        else:
            return f"📝 {obj.title}"
    titulo.short_description = 'Título del Artículo'
    
    def categoria(self, obj):
        return f"{obj.category.icon} {obj.category.name}"
    categoria.short_description = 'Categoría'
    
    def tiempo_lectura(self, obj):
        return f"📖 {obj.estimated_read_time} min"
    tiempo_lectura.short_description = 'Tiempo'
    
    def publicado(self, obj):
        if obj.is_published:
            return "✅ SÍ"
        else:
            return "❌ NO"
    publicado.short_description = 'Publicado'
    
    def fecha_creacion(self, obj):
        return obj.created_at.strftime('%d/%m/%Y')
    fecha_creacion.short_description = 'Creado'

    # Cambiar nombres en el admin
    class Meta:
        verbose_name = "📚 Contenido General"
        verbose_name_plural = "📚 CONTENIDO GENERAL (Para todos)"

# ========================================
# 🏆 CONTENIDO DESBLOQUEADO (Premium)
# ========================================
@admin.register(UnlockableEducationalContent)
class ContenidoDesbloqueadoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'tipo_desbloqueo', 'activo', 'fecha_creacion')
    list_filter = ('category', 'unlock_type', 'is_active', 'created_at')
    search_fields = ('title', 'content')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('✏️ ESCRIBIR ARTÍCULO', {
            'fields': ('title', 'content'),
            'description': '👇 Aquí escribes el título, resumen y contenido completo del artículo'
        }),
        ('🔐 CUÁNDO SE DESBLOQUEA', {
            'fields': ('unlock_type', 'required_medal',),
            'description': '👇 Define cuándo los usuarios podrán ver este artículo'
        }),
        ('📂 CONFIGURACIÓN', {
            'fields': ('category', 'estimated_read_time', 'is_active'),
            'description': '👇 Categoría, tiempo de lectura y si está activo'
        }),
    )
    
    # Hacer el campo de contenido más grande
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 15, 'cols': 100})},
    }
    
    # Nombres más claros para Alejandro
    def titulo(self, obj):
        if obj.is_active:
            return f"✅ {obj.title}"
        else:
            return f"📝 {obj.title}"
    titulo.short_description = 'Título del Artículo'
    
    def categoria(self, obj):
        return f"{obj.category.icon} {obj.category.name}"
    categoria.short_description = 'Categoría'
    
    def tipo_desbloqueo(self, obj):
        if obj.unlock_type == 'MEDAL' and obj.required_medal:
            return f"🏆 Medalla: {obj.required_medal.name}"
        elif obj.unlock_type == 'POINTS':
            return f"🎯 {obj.required_points} puntos"
        elif obj.unlock_type == 'LEVEL':
            return f"🏆 Nivel {obj.required_level}"
        elif obj.unlock_type == 'CYCLE':
            return f"📅 Ciclo {obj.required_cycle}"
        return '❓ No definido'
    tipo_desbloqueo.short_description = 'Se desbloquea con'
    
    def activo(self, obj):
        if obj.is_active:
            return "✅ SÍ"
        else:
            return "❌ NO"
    activo.short_description = 'Activo'
    
    def fecha_creacion(self, obj):
        return obj.created_at.strftime('%d/%m/%Y')
    fecha_creacion.short_description = 'Creado'

    class Meta:
        verbose_name = "🏆 Contenido Desbloqueado"
        verbose_name_plural = "🏆 CONTENIDO DESBLOQUEADO (Premium)"



# ========================================
# OCULTAR LO QUE NO NECESITA ALEJANDRO
# ========================================
# No registramos UserContentAccess ni UserReadingSession
# para que Alejandro no se confunda

# Personalización del admin
admin.site.site_header = "📚 Gastro Assistant - Panel de Contenidos"
admin.site.site_title = "Contenidos"
admin.site.index_title = "📝 Crear y Gestionar Contenidos"