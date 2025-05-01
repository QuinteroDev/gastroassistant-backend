# recommendations/models.py
from django.db import models
from django.contrib.auth.models import User

class RecommendationType(models.Model):
    """
    Tipos de recomendaciones que se pueden activar en base a diversas condiciones.
    """
    CONDITION_TYPES = [
        ('BMI', 'Índice de Masa Corporal'),
        ('HERNIA', 'Hernia de hiato'),
        ('MOTILITY', 'Motilidad esofágica alterada'),
        ('EMPTYING', 'Vaciamiento gástrico lento'),
        ('SALIVA', 'Salivación reducida'),
        ('CONSTIPATION', 'Estreñimiento'),
        ('STRESS', 'Estrés o ansiedad'),
        ('PHENOTYPE', 'Fenotipo ERGE'),
        ('HABIT', 'Hábito específico')
    ]
    
    type = models.CharField(
        max_length=20,
        choices=CONDITION_TYPES,
        verbose_name="Tipo de condición"
    )
    name = models.CharField(max_length=100, verbose_name="Nombre")
    description = models.TextField(blank=True, verbose_name="Descripción")
    is_active = models.BooleanField(default=True, verbose_name="Está activo")
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    class Meta:
        verbose_name = "Tipo de recomendación"
        verbose_name_plural = "Tipos de recomendaciones"

class ConditionalRecommendation(models.Model):
    """
    Recomendaciones que se activan basadas en condiciones específicas del usuario.
    """
    recommendation_type = models.ForeignKey(
        RecommendationType,
        on_delete=models.CASCADE,
        related_name='recommendations',
        verbose_name="Tipo de recomendación"
    )
    title = models.CharField(max_length=255, verbose_name="Título")
    content = models.TextField(verbose_name="Contenido")
    condition_value = models.CharField(
        max_length=50, 
        verbose_name="Valor de la condición",
        help_text="Valor específico que activa esta recomendación (ej: 'YES', 'BMI_OVER_25', 'EROSIVE')"
    )
    tools = models.TextField(
        blank=True,
        verbose_name="Herramientas sugeridas",
        help_text="Lista separada por comas de herramientas sugeridas"
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")
    is_active = models.BooleanField(default=True, verbose_name="Está activa")
    
    def __str__(self):
        return f"{self.title} ({self.recommendation_type.name} - {self.condition_value})"
    
    class Meta:
        ordering = ['recommendation_type', 'order']
        verbose_name = "Recomendación condicional"
        verbose_name_plural = "Recomendaciones condicionales"

class UserRecommendation(models.Model):
    """
    Recomendaciones asignadas a un usuario específico.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recommendations',
        verbose_name="Usuario"
    )
    recommendation = models.ForeignKey(
        ConditionalRecommendation,
        on_delete=models.CASCADE,
        verbose_name="Recomendación"
    )
    is_read = models.BooleanField(default=False, verbose_name="Ha sido leída")
    is_prioritized = models.BooleanField(default=False, verbose_name="Es prioritaria")
    assigned_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.recommendation.title}"
    
    class Meta:
        ordering = ['-is_prioritized', '-assigned_at']
        verbose_name = "Recomendación de usuario"
        verbose_name_plural = "Recomendaciones de usuario"