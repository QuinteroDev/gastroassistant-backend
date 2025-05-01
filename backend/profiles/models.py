# profiles/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator, MaxValueValidator

class UserProfile(models.Model):
    # Fenotipos ERGE según la Guía 2019
    PHENOTYPE_CHOICES = [
        ('EROSIVE', 'ERGE Erosiva'),
        ('NERD', 'ERGE No Erosiva (NERD)'),
        ('EXTRAESOPHAGEAL', 'Reflujo Extraesofágico'),
        ('FUNCTIONAL', 'Perfil Funcional / Hipersensibilidad'),
        ('SYMPTOMS_NO_TESTS', 'Síntomas sin Pruebas'),
        ('EXTRAESOPHAGEAL_NO_TESTS', 'Síntomas Extraesofágicos sin Pruebas'),
        ('NO_SYMPTOMS', 'Sin Síntomas ni Pruebas'),
        ('UNDETERMINED', 'No Determinado')
    ]
    
    # Resultados de endoscopia
    ENDOSCOPY_CHOICES = [
        ('NORMAL', 'Normal'),
        ('ESOPHAGITIS_A', 'Esofagitis Grado A'),
        ('ESOPHAGITIS_B', 'Esofagitis Grado B'),
        ('ESOPHAGITIS_C', 'Esofagitis Grado C'),
        ('ESOPHAGITIS_D', 'Esofagitis Grado D'),
        ('NOT_DONE', 'No Realizada')
    ]
    
    # Resultados de pH-metría
    PH_MONITORING_CHOICES = [
        ('POSITIVE', 'Positiva (Reflujo +)'),
        ('NEGATIVE', 'Negativa (Reflujo -)'),
        ('UNKNOWN', 'Resultado Desconocido'),
        ('NOT_DONE', 'No Realizada')
    ]
    
    # Opciones para preguntas clínicas de reflujo
    YES_NO_UNKNOWN_CHOICES = [
        ('YES', 'Sí'),
        ('NO', 'No'),
        ('UNKNOWN', 'No lo sé')
    ]

    # Opciones para estrés/ansiedad
    STRESS_ANXIETY_CHOICES = [
        ('YES', 'Sí, claramente'),
        ('SOMETIMES', 'A veces'),
        ('NO', 'No')
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Datos básicos y cálculo de IMC
    weight_kg = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="Peso (kg)",
        validators=[MinValueValidator(30), MaxValueValidator(250)]
    )
    height_cm = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="Altura (cm)",
        validators=[MinValueValidator(100), MaxValueValidator(240)]
    )
    bmi = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="Índice de Masa Corporal",
        help_text="Calculado automáticamente"
    )
    has_excess_weight = models.BooleanField(
        default=False,
        verbose_name="Tiene exceso de peso (IMC ≥ 25)"
    )
    
    # Factores clínicos asociados al reflujo
    has_hernia = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Hernia de hiato o cardias incompetente"
    )
    has_altered_motility = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Motilidad esofágica alterada"
    )
    has_slow_emptying = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Vaciamiento gástrico lento (gastroparesia)"
    )
    has_dry_mouth = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Salivación reducida / sequedad bucal"
    )
    has_constipation = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Estreñimiento o esfuerzo al defecar"
    )
    stress_affects = models.CharField(
        max_length=10,
        choices=STRESS_ANXIETY_CHOICES,
        default='UNKNOWN',
        verbose_name="Estrés o ansiedad como agravantes"
    )
    
    # Campos para pruebas diagnósticas
    has_endoscopy = models.BooleanField(default=False, verbose_name="Ha realizado endoscopia")
    endoscopy_result = models.CharField(
        max_length=20, 
        choices=ENDOSCOPY_CHOICES, 
        default='NOT_DONE',
        verbose_name="Resultado de la endoscopia"
    )
    
    has_ph_monitoring = models.BooleanField(default=False, verbose_name="Ha realizado pH-metría")
    ph_monitoring_result = models.CharField(
        max_length=20, 
        choices=PH_MONITORING_CHOICES, 
        default='NOT_DONE',
        verbose_name="Resultado de la pH-metría"
    )
    
    # Clasificación fenotípica (se calculará basado en los cuestionarios y pruebas)
    phenotype = models.CharField(
        max_length=30, 
        choices=PHENOTYPE_CHOICES, 
        default='UNDETERMINED',
        verbose_name="Fenotipo"
    )
    
    # Escenario A-L según la clasificación de la guía
    scenario = models.CharField(
        max_length=1, 
        blank=True, 
        null=True,
        verbose_name="Escenario (A-L)"
    )
    
    onboarding_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular el IMC si hay peso y altura
        if self.weight_kg and self.height_cm:
            # Convertir altura de cm a m
            height_m = self.height_cm / 100
            # Calcular IMC
            self.bmi = round(self.weight_kg / (height_m * height_m), 2)
            # Determinar si tiene exceso de peso
            self.has_excess_weight = self.bmi >= 25
        super().save(*args, **kwargs)
    
    def __str__(self):
        try:
            username = self.user.username
        except User.DoesNotExist:
            username = "[Usuario no disponible]"
        except AttributeError:
            username = "[Usuario no asignado]"
        return f"Perfil de {username}"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        UserProfile.objects.get_or_create(user=instance)