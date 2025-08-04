# cycles/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator  # ← Faltaba esta línea
from datetime import timedelta
import uuid

class UserCycle(models.Model):
    """
    Representa un ciclo de 30 días para un usuario.
    """
    CYCLE_STATUS = [
        ('ACTIVE', 'Activo'),
        ('PENDING_RENEWAL', 'Pendiente de renovación'),
        ('COMPLETED', 'Completado'),
        ('EXPIRED', 'Expirado')
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='cycles',
        verbose_name="Usuario"
    )
    cycle_number = models.PositiveIntegerField(
        verbose_name="Número de ciclo",
        help_text="1 para el primer ciclo, 2 para el segundo, etc."
    )
    start_date = models.DateTimeField(verbose_name="Fecha de inicio")
    end_date = models.DateTimeField(verbose_name="Fecha de fin")
    status = models.CharField(
        max_length=20,
        choices=CYCLE_STATUS,
        default='ACTIVE',
        verbose_name="Estado"
    )
    
    # Scores de los cuestionarios para este ciclo
    gerdq_score = models.IntegerField(null=True, blank=True)
    rsi_score = models.IntegerField(null=True, blank=True)
    
    # Fenotipo asignado en este ciclo
    phenotype = models.CharField(
        max_length=30,
        choices=[
            ('EROSIVE', 'ERGE Erosiva'),
            ('NERD', 'ERGE No Erosiva (NERD)'),
            ('EXTRAESOPHAGEAL', 'Reflujo Extraesofágico'),
            ('FUNCTIONAL', 'Perfil Funcional / Hipersensibilidad'),
            ('SYMPTOMS_NO_TESTS', 'Síntomas sin Pruebas'),
            ('NO_SYMPTOMS', 'Sin Síntomas ni Pruebas'),
            ('UNDETERMINED', 'No Determinado')
        ],
        default='UNDETERMINED'
    )
    
    # Programa asignado para este ciclo
    program = models.ForeignKey(
        'programs.TreatmentProgram',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Hábitos asignados para tracking en este ciclo (los 5 peores)
    tracked_habits = models.ManyToManyField(
        'questionnaires.HabitQuestion',
        through='CycleHabitAssignment'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    onboarding_completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-cycle_number']
        unique_together = ('user', 'cycle_number')
        verbose_name = "Ciclo de usuario"
        verbose_name_plural = "Ciclos de usuario"
    
    def __str__(self):
        return f"{self.user.username} - Ciclo {self.cycle_number} ({self.status})"
    
    @property
    def days_elapsed(self):
        """
        Calcula los días transcurridos desde el inicio del ciclo.
        Día 1 = día de inicio
        Día 30 = último día del ciclo
        """
        if not self.start_date:
            return 0
        
        now = timezone.now()
        
        # Calcular diferencia en días completos
        diff = (now.date() - self.start_date.date()).days
        
        # El día de inicio es día 1
        days_in_cycle = diff + 1
        
        # IMPORTANTE: Limitar a máximo 30 días
        return min(days_in_cycle, 30)
    
    @property
    def days_remaining(self):
        """
        Calcula los días restantes hasta el final del ciclo.
        Cuando days_elapsed = 30, debe retornar 0
        """
        days_completed = self.days_elapsed
        remaining = 30 - days_completed
        
        # Asegurar que nunca sea negativo
        return max(0, remaining)


    def check_and_update_status(self):
        """
        Actualiza el estado cuando se completan 30 días.
        Se activa cuando days_elapsed = 30 (days_remaining = 0)
        """
        if self.status == 'ACTIVE':
            # Cambiar la condición para que se active en día 30
            if self.days_elapsed >= 30:  # Cambio aquí: >= 30 en lugar de days_remaining <= 0
                self.status = 'PENDING_RENEWAL'
                self.save()
                print(f"Ciclo {self.id} actualizado a PENDING_RENEWAL (día {self.days_elapsed})")
        
        return self.status
    

class CycleHabitAssignment(models.Model):
    """
    Relación entre ciclos y hábitos asignados para tracking.
    """
    cycle = models.ForeignKey(UserCycle, on_delete=models.CASCADE)
    habit = models.ForeignKey('questionnaires.HabitQuestion', on_delete=models.CASCADE)
    initial_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        verbose_name="Puntuación inicial"
    )
    priority_order = models.PositiveIntegerField(
        verbose_name="Orden de prioridad",
        help_text="1 para el peor hábito, 5 para el quinto peor"
    )
    
    class Meta:
        ordering = ['priority_order']
        unique_together = ('cycle', 'habit')

class CycleSnapshot(models.Model):
    """
    Captura del estado del usuario al inicio de cada ciclo.
    """
    cycle = models.OneToOneField(
        UserCycle,
        on_delete=models.CASCADE,
        related_name='snapshot'
    )
    
    # Datos físicos
    weight_kg = models.FloatField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    bmi = models.FloatField(null=True, blank=True)
    
    # Factores clínicos (copiados del perfil)
    has_hernia = models.CharField(max_length=10, default='UNKNOWN')
    has_altered_motility = models.CharField(max_length=10, default='UNKNOWN')
    has_slow_emptying = models.CharField(max_length=10, default='UNKNOWN')
    has_dry_mouth = models.CharField(max_length=10, default='UNKNOWN')
    has_constipation = models.CharField(max_length=10, default='UNKNOWN')
    stress_affects = models.CharField(max_length=10, default='UNKNOWN')
    
    # Pruebas diagnósticas
    endoscopy_result = models.CharField(max_length=20, default='NOT_DONE')
    ph_monitoring_result = models.CharField(max_length=20, default='NOT_DONE')
    
    # Respuestas a todos los hábitos (JSON para flexibilidad)
    habit_scores = models.JSONField(
        default=dict,
        help_text="Diccionario con habit_type: score"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Snapshot - {self.cycle}"