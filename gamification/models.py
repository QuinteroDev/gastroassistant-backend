# gamification/models.py - VERSIÓN MODIFICADA
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class UserLevel(models.Model):
    """
    Nivel y progreso de gamificación de cada usuario
    MODIFICADO: Usa los ciclos existentes en lugar de meses arbitrarios
    """
    LEVEL_CHOICES = [
        ('NOVATO', 'Novato 🟤'),
        ('BRONCE', 'Bronce 🥉'),
        ('PLATA', 'Plata 🥈'),
        ('ORO', 'Oro 🥇'),
        ('PLATINO', 'Platino 💎'),
        ('MAESTRO', 'Maestro 👑'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='gamification_level'
    )
    
    # CAMBIO: Referenciar el ciclo actual en lugar de mes numérico
    current_cycle = models.ForeignKey(
        'cycles.UserCycle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gamification_data',
        verbose_name="Ciclo actual"
    )
    
    # Nivel actual (nunca baja)
    current_level = models.CharField(
        max_length=20, 
        choices=LEVEL_CHOICES, 
        default='NOVATO',
        verbose_name="Nivel actual"
    )
    
    # Puntuación
    total_points_all_time = models.IntegerField(
        default=0,
        verbose_name="Puntos totales históricos"
    )
    current_cycle_points = models.IntegerField(
        default=0,
        verbose_name="Puntos del ciclo actual"
    )
    
    # Rachas
    current_streak = models.IntegerField(
        default=0,
        verbose_name="Racha actual (días consecutivos)"
    )
    longest_streak = models.IntegerField(
        default=0,
        verbose_name="Racha más larga"
    )
    last_activity_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name="Última actividad"
    )
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        cycle_num = self.current_cycle.cycle_number if self.current_cycle else "Sin ciclo"
        return f"{self.user.username} - {self.get_current_level_display()} (Ciclo {cycle_num})"
    
    @property
    def cycle_number(self):
        """Número del ciclo actual"""
        return self.current_cycle.cycle_number if self.current_cycle else 1
    
    class Meta:
        verbose_name = "Nivel de Usuario"
        verbose_name_plural = "Niveles de Usuario"

class Medal(models.Model):
    """
    Medallas disponibles en el sistema
    MODIFICADO: Ahora se basa en número de ciclo en lugar de mes
    """
    LEVEL_CHOICES = UserLevel.LEVEL_CHOICES
    
    name = models.CharField(max_length=100, verbose_name="Nombre de la medalla")
    description = models.TextField(verbose_name="Descripción")
    icon = models.CharField(
        max_length=50, 
        default='🏆',
        verbose_name="Icono (emoji)"
    )
    
    # CAMBIO: Requisitos basados en número de ciclo
    required_points = models.IntegerField(
        verbose_name="Puntos requeridos en el ciclo"
    )
    required_level = models.CharField(
        max_length=20, 
        choices=LEVEL_CHOICES,
        verbose_name="Nivel requerido"
    )
    required_cycle_number = models.IntegerField(
        validators=[MinValueValidator(1)],
        # null=True,        # ← QUITAR ESTA LÍNEA
        # blank=True,       # ← QUITAR ESTA LÍNEA
        verbose_name="Número de ciclo requerido"
    )
    
    # Organización dentro del ciclo
    order = models.IntegerField(
        default=0,
        verbose_name="Orden dentro del ciclo"
    )
    week_number = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        default=1,
        verbose_name="Semana objetivo (1-4)"
    )
    
    # Control
    is_active = models.BooleanField(default=True, verbose_name="Está activa")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.icon} {self.name} (Ciclo {self.required_cycle_number})"
    
    class Meta:
        ordering = ['required_cycle_number', 'week_number', 'order']
        verbose_name = "Medalla"
        verbose_name_plural = "Medallas"

class CycleGamificationSummary(models.Model):
    """
    Resumen de gamificación por ciclo completado
    NUEVO: Para trackear el progreso histórico por ciclo
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cycle = models.OneToOneField(
        'cycles.UserCycle',
        on_delete=models.CASCADE,
        related_name='gamification_summary'
    )
    
    # Estadísticas del ciclo
    total_points_earned = models.IntegerField(default=0)
    final_level = models.CharField(max_length=20)
    medals_earned_count = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)
    
    # Días de actividad
    active_days = models.IntegerField(default=0)
    perfect_days = models.IntegerField(default=0)  # Días con todos los hábitos completados
    
    # Ranking en el ciclo (si implementamos)
    cycle_ranking = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - Resumen Ciclo {self.cycle.cycle_number}"
    
    class Meta:
        verbose_name = "Resumen de Gamificación por Ciclo"
        verbose_name_plural = "Resúmenes de Gamificación por Ciclo"

# UserMedal y DailyPoints se mantienen igual...
class UserMedal(models.Model):
    """
    Medallas conseguidas por cada usuario
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='earned_medals'
    )
    medal = models.ForeignKey(
        Medal, 
        on_delete=models.CASCADE
    )
    
    # CAMBIO: Referencia al ciclo en lugar de mes numérico
    cycle_earned = models.ForeignKey(
        'cycles.UserCycle',
        on_delete=models.CASCADE,
        # null=True,        # ← QUITAR ESTA LÍNEA
        # blank=True,       # ← QUITAR ESTA LÍNEA
        verbose_name="Ciclo cuando se obtuvo"
    )
    
    # Datos del momento de conseguir la medalla
    earned_at = models.DateTimeField(auto_now_add=True)
    points_when_earned = models.IntegerField(
        verbose_name="Puntos cuando se obtuvo"
    )
    level_when_earned = models.CharField(
        max_length=20,
        verbose_name="Nivel cuando se obtuvo"
    )
    
    def __str__(self):
        return f"{self.user.username} - {self.medal.name} (Ciclo {self.cycle_earned.cycle_number})"
    
    class Meta:
        unique_together = ('user', 'medal')
        ordering = ['-earned_at']
        verbose_name = "Medalla de Usuario"
        verbose_name_plural = "Medallas de Usuario"

class DailyPoints(models.Model):
    """
    Registro diario de puntos para tracking detallado
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='daily_points'
    )
    cycle = models.ForeignKey(
        'cycles.UserCycle',
        on_delete=models.CASCADE,
        # null=True,        # ← QUITAR ESTA LÍNEA
        # blank=True,       # ← QUITAR ESTA LÍNEA
        verbose_name="Ciclo al que pertenece"
    )
    date = models.DateField(verbose_name="Fecha")
    
    # Puntos detallados (mismo esquema que antes)
    habit_points = models.IntegerField(default=0, verbose_name="Puntos por hábitos")
    bonus_completion = models.IntegerField(default=0, verbose_name="Bonus por completar todos")
    bonus_streak = models.IntegerField(default=0, verbose_name="Bonus por racha")
    bonus_promoted_habit = models.IntegerField(default=0, verbose_name="Bonus hábito promocionado")
    
    # Total del día
    total_points = models.IntegerField(default=0, verbose_name="Total de puntos del día")
    
    # Metadatos
    habits_completed = models.IntegerField(default=0, verbose_name="Hábitos completados (≥2 puntos)")
    habits_total = models.IntegerField(default=5, verbose_name="Total de hábitos activos")
    streak_on_date = models.IntegerField(default=0, verbose_name="Racha en esta fecha")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.total_points}pts) - Ciclo {self.cycle.cycle_number}"
    
    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']
        verbose_name = "Puntos Diarios"
        verbose_name_plural = "Puntos Diarios"