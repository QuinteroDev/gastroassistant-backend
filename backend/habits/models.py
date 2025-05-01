# habits/models.py
from django.db import models
from django.contrib.auth.models import User
from questionnaires.models import HabitQuestion

class HabitTracker(models.Model):
    """
    Modelo para el seguimiento de hábitos personalizados para cada usuario.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='habit_trackers',
        verbose_name="Usuario"
    )
    habit = models.ForeignKey(
        HabitQuestion,
        on_delete=models.CASCADE,
        related_name='trackers',
        verbose_name="Hábito"
    )
    is_active = models.BooleanField(default=True, verbose_name="Está activo")
    is_promoted = models.BooleanField(default=False, verbose_name="Es promocionado")
    target_score = models.IntegerField(
        default=3,
        verbose_name="Puntuación objetivo"
    )
    current_score = models.IntegerField(
        default=0,
        verbose_name="Puntuación actual"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.habit}"
    
    class Meta:
        unique_together = ('user', 'habit')
        ordering = ['-is_promoted', 'habit']
        verbose_name = "Seguimiento de hábito"
        verbose_name_plural = "Seguimientos de hábitos"

class HabitLog(models.Model):
    """
    Registro diario del cumplimiento de hábitos.
    """
    COMPLETION_CHOICES = [
        (0, 'No completado'),
        (1, 'Parcialmente completado'),
        (2, 'Mayormente completado'),
        (3, 'Completamente logrado')
    ]
    
    tracker = models.ForeignKey(
        HabitTracker,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="Seguimiento"
    )
    date = models.DateField(verbose_name="Fecha")
    completion_level = models.IntegerField(
        choices=COMPLETION_CHOICES,
        default=0,
        verbose_name="Nivel de cumplimiento"
    )
    notes = models.TextField(blank=True, verbose_name="Notas")
    logged_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.tracker.user.username} - {self.tracker.habit} - {self.date}"
    
    class Meta:
        unique_together = ('tracker', 'date')
        ordering = ['-date']
        verbose_name = "Registro de hábito"
        verbose_name_plural = "Registros de hábitos"

class HabitStreak(models.Model):
    """
    Registro de rachas de cumplimiento de hábitos.
    """
    tracker = models.OneToOneField(
        HabitTracker,
        on_delete=models.CASCADE,
        related_name='streak',
        verbose_name="Seguimiento"
    )
    current_streak = models.IntegerField(default=0, verbose_name="Racha actual")
    longest_streak = models.IntegerField(default=0, verbose_name="Racha más larga")
    last_log_date = models.DateField(null=True, blank=True, verbose_name="Fecha del último registro")
    
    def __str__(self):
        return f"{self.tracker.user.username} - {self.tracker.habit} - Racha: {self.current_streak}"
    
    class Meta:
        verbose_name = "Racha de hábito"
        verbose_name_plural = "Rachas de hábitos"