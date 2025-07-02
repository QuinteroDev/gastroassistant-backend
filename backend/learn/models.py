# learn/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class ContentCategory(models.Model):
    """Categorías de contenido educativo"""
    CATEGORY_TYPES = [
        ('BASIC', '📚 Conceptos Básicos'),
        ('NUTRITION', '🍎 Alimentación'),
        ('EXERCISE', '🏃 Ejercicio y Movimiento'),
        ('STRESS', '🧘 Manejo del Estrés'),
        ('MEDICAL', '🩺 Información Médica'),
        ('ADVANCED', '🎓 Contenido Avanzado'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nombre")
    category_type = models.CharField(
        max_length=20, 
        choices=CATEGORY_TYPES,
        verbose_name="Tipo de categoría"
    )
    description = models.TextField(blank=True, verbose_name="Descripción")
    icon = models.CharField(max_length=10, default='📚', verbose_name="Icono")
    order = models.IntegerField(default=0, verbose_name="Orden")
    is_active = models.BooleanField(default=True, verbose_name="Está activa")
    
    def __str__(self):
        return f"{self.icon} {self.name}"
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Categoría de Contenido"
        verbose_name_plural = "Categorías de Contenido"

class StaticEducationalContent(models.Model):
    """Contenido educativo fijo - siempre disponible"""
    title = models.CharField(max_length=200, verbose_name="Título")
    content = models.TextField(verbose_name="Contenido completo")
    summary = models.TextField(max_length=300, blank=True, verbose_name="Resumen")
    
    category = models.ForeignKey(
        ContentCategory,
        on_delete=models.CASCADE,
        related_name='static_content',
        verbose_name="Categoría"
    )
    
    # Metadatos
    estimated_read_time = models.IntegerField(default=5, verbose_name="Tiempo de lectura (min)")
    tags = models.CharField(max_length=200, blank=True, verbose_name="Etiquetas (separadas por comas)")
    
    # Control de publicación
    is_published = models.BooleanField(default=True, verbose_name="Publicado")
    order = models.IntegerField(default=0, verbose_name="Orden en categoría")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"[{self.category.name}] {self.title}"
    
    class Meta:
        ordering = ['category', 'order', 'title']
        verbose_name = "Contenido Educativo Fijo"
        verbose_name_plural = "Contenidos Educativos Fijos"

class UnlockableEducationalContent(models.Model):
    """Contenido educativo que se desbloquea con medallas/puntos"""
    UNLOCK_TYPE_CHOICES = [
        ('MEDAL', 'Por medalla específica'),
        ('POINTS', 'Por puntos del ciclo'),
        ('LEVEL', 'Por nivel del usuario'),
        ('CYCLE', 'Por número de ciclo'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Título")
    content = models.TextField(verbose_name="Contenido completo")
    summary = models.TextField(max_length=300, blank=True, verbose_name="Resumen")
    
    category = models.ForeignKey(
        ContentCategory,
        on_delete=models.CASCADE,
        related_name='unlockable_content',
        verbose_name="Categoría"
    )
    
    # Requisitos de desbloqueo
    unlock_type = models.CharField(
        max_length=10,
        choices=UNLOCK_TYPE_CHOICES,
        default='MEDAL',
        verbose_name="Tipo de desbloqueo"
    )
    
    # Para desbloqueo por medalla
    required_medal = models.ForeignKey(
        'gamification.Medal',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Medalla requerida"
    )
    
    # Para desbloqueo por puntos
    required_points = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Puntos requeridos"
    )
    
    # Para desbloqueo por nivel
    required_level = models.CharField(
        max_length=20,
        choices=[
            ('NOVATO', 'Novato'),
            ('BRONCE', 'Bronce'),
            ('PLATA', 'Plata'),
            ('ORO', 'Oro'),
            ('PLATINO', 'Platino'),
            ('MAESTRO', 'Maestro'),
        ],
        null=True,
        blank=True,
        verbose_name="Nivel requerido"
    )
    
    # Para desbloqueo por ciclo
    required_cycle = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name="Ciclo requerido"
    )
    
    # Metadatos
    estimated_read_time = models.IntegerField(default=5, verbose_name="Tiempo de lectura (min)")
    tags = models.CharField(max_length=200, blank=True, verbose_name="Etiquetas")
    
    # Control
    is_active = models.BooleanField(default=True, verbose_name="Está activo")
    order = models.IntegerField(default=0, verbose_name="Orden en categoría")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        unlock_info = ""
        if self.unlock_type == 'MEDAL' and self.required_medal:
            unlock_info = f"Medalla: {self.required_medal.name}"
        elif self.unlock_type == 'POINTS':
            unlock_info = f"{self.required_points} puntos"
        elif self.unlock_type == 'LEVEL':
            unlock_info = f"Nivel {self.required_level}"
        elif self.unlock_type == 'CYCLE':
            unlock_info = f"Ciclo {self.required_cycle}"
        
        return f"🔒 {self.title} ({unlock_info})"
    
    class Meta:
        ordering = ['category', 'order', 'title']
        verbose_name = "Contenido Educativo Desbloqueado"
        verbose_name_plural = "Contenidos Educativos Desbloqueados"

class UserContentAccess(models.Model):
    """Registro de contenidos desbloqueados por usuario"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Puede ser contenido estático o desbloqueado
    static_content = models.ForeignKey(
        StaticEducationalContent,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    unlockable_content = models.ForeignKey(
        UnlockableEducationalContent,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    # Timestamps importantes
    unlocked_at = models.DateTimeField(auto_now_add=True)
    first_read_at = models.DateTimeField(null=True, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    
    # Progreso de lectura
    is_read = models.BooleanField(default=False, verbose_name="Ha sido leído")
    read_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Porcentaje leído"
    )
    is_favorite = models.BooleanField(default=False, verbose_name="Es favorito")
    
    # Metadatos
    read_count = models.IntegerField(default=0, verbose_name="Veces leído")
    
    def __str__(self):
        content_title = ""
        if self.static_content:
            content_title = self.static_content.title
        elif self.unlockable_content:
            content_title = self.unlockable_content.title
        
        return f"{self.user.username} - {content_title}"
    
    @property
    def content_title(self):
        if self.static_content:
            return self.static_content.title
        elif self.unlockable_content:
            return self.unlockable_content.title
        return "Sin título"
    
    class Meta:
        verbose_name = "Acceso de Usuario a Contenido"
        verbose_name_plural = "Accesos de Usuario a Contenido"

class UserReadingSession(models.Model):
    """Registro detallado de sesiones de lectura"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_access = models.ForeignKey(UserContentAccess, on_delete=models.CASCADE)
    
    session_start = models.DateTimeField(auto_now_add=True)
    session_end = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(default=0)
    scroll_percentage = models.IntegerField(default=0)
    completed_reading = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} - {self.content_access.content_title} ({self.session_start.date()})"
    
    class Meta:
        ordering = ['-session_start']
        verbose_name = "Sesión de Lectura"
        verbose_name_plural = "Sesiones de Lectura"