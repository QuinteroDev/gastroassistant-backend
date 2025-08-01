# profiles/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from datetime import timedelta
from django.utils import timezone

class UserProfile(models.Model):
    # Fenotipos ERGE según la Guía 2019
    PHENOTYPE_CHOICES = [
        ('EROSIVE', 'ERGE Erosiva'),
        ('NERD', 'ERGE No Erosiva (NERD)'),
        ('NERD_MIXED', 'ERGE No Erosiva Mixta'),
        ('EXTRAESOPHAGEAL', 'Reflujo Extraesofágico'),
        ('FUNCTIONAL', 'Perfil Funcional / Hipersensibilidad'),
        ('SYMPTOMS_NO_TESTS', 'Síntomas sin Pruebas'),
        ('EXTRAESOPHAGEAL_NO_TESTS', 'Síntomas Extraesofágicos sin Pruebas'),
        ('NO_SYMPTOMS', 'Sin Síntomas ni Pruebas'),
        ('UNDETERMINED', 'No Determinado')
    ]

    SCENARIO_CHOICES = [
        ('A', 'A - Endoscopia positiva'),
        ('B', 'B - NERD Mixto (Endo- pH+ GERDq+ RSI+)'),
        ('C', 'C - NERD (Endo- pH+ GERDq+ RSI-)'),
        ('D', 'D - Extraesofágico (Endo- pH+ GERDq- RSI+)'),
        ('E', 'E - Bienestar (Endo- pH+ GERDq- RSI-)'),
        ('F', 'F - Funcional (Endo- pH- GERDq+ RSI+)'),
        ('F2', 'F2 - Funcional (Endo- pH- GERDq+ RSI-)'),
        ('F3', 'F3 - Funcional (Endo- pH- GERDq- RSI+)'),
        ('F4', 'F4 - Bienestar (Endo- pH- GERDq- RSI-)'),
        ('G', 'G - Mixto sin pH (Endo- No pH GERDq+ RSI+)'),
        ('H', 'H - Digestivo sin pH (Endo- No pH GERDq+ RSI-)'),
        ('I', 'I - Extraesofágico sin pH (Endo- No pH GERDq- RSI+)'),
        ('J', 'J - Bienestar sin pH (Endo- No pH GERDq- RSI-)'),
        ('K', 'K - Mixto sin Endo (No Endo pH hecha GERDq+ RSI+)'),
        ('L', 'L - Digestivo sin Endo (No Endo pH hecha GERDq+ RSI-)'),
        ('M', 'M - Extraesofágico sin Endo (No Endo pH hecha GERDq- RSI+)'),
        ('N', 'N - Bienestar sin Endo (No Endo pH hecha GERDq- RSI-)'),
        ('O', 'O - Mixto sin pruebas (No pruebas GERDq+ RSI+)'),
        ('P', 'P - Digestivo sin pruebas (No pruebas GERDq+ RSI-)'),
        ('Q', 'Q - Extraesofágico sin pruebas (No pruebas GERDq- RSI+)'),
        ('R', 'R - Bienestar sin pruebas (No pruebas GERDq- RSI-)'),
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
    
    # Opciones para estreñimiento (nueva)
    CONSTIPATION_CHOICES = [
        ('YES', 'Sí'),
        ('SOMETIMES', 'A veces'),
        ('NO', 'No')
    ]
    
    # NUEVAS OPCIONES PARA LOS 5 CAMPOS FALTANTES
    
    # Para Helicobacter pylori (4 opciones)
    H_PYLORI_CHOICES = [
        ('ACTIVE', 'Sí, actualmente activa'),
        ('TREATED', 'Sí, pero ya tratada'),
        ('NO', 'No'),
        ('UNKNOWN', 'No lo sé')
    ]
    
    # Para tabaquismo (2 opciones)
    SMOKING_CHOICES = [
        ('YES', 'Sí'),
        ('NO', 'No')
    ]
    
    # Para alcohol (3 opciones)
    ALCOHOL_CHOICES = [
        ('YES', 'Sí'),
        ('OCCASIONALLY', 'Ocasionalmente'),
        ('NO', 'No')
    ]

    AVATAR_CHOICES = [
        ('default', 'Sin avatar'),
        ('avatar1', 'Avatar 1'),
        ('avatar2', 'Avatar 2'), 
        ('avatar3', 'Avatar 3'),
        ('avatar4', 'Avatar 4'),
        ('avatar5', 'Avatar 5'),
    ]
    
    # 🆕 Campo avatar
    avatar = models.CharField(
        max_length=20,
        choices=AVATAR_CHOICES,
        default='default',
        verbose_name="Avatar del usuario"
    )
    
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
    
    # Factores clínicos asociados al reflujo (CAMPOS EXISTENTES)
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
        choices=CONSTIPATION_CHOICES,
        default='NO',
        verbose_name="Estreñimiento o esfuerzo al defecar"
    )
    stress_affects = models.CharField(
        max_length=10,
        choices=STRESS_ANXIETY_CHOICES,
        default='UNKNOWN',
        verbose_name="Estrés o ansiedad como agravantes"
    )
    
    # NUEVOS CAMPOS PARA LAS 5 PREGUNTAS FALTANTES
    
    # Pregunta 2: Gastritis
    has_gastritis = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Gastritis o inflamación gástrica diagnosticada"
    )
    
    # Pregunta 3: Helicobacter pylori  
    h_pylori_status = models.CharField(
        max_length=10,
        choices=H_PYLORI_CHOICES,
        default='UNKNOWN',
        verbose_name="Infección por Helicobacter pylori"
    )
    
    # Pregunta 9: Alteraciones intestinales
    has_intestinal_disorders = models.CharField(
        max_length=10,
        choices=YES_NO_UNKNOWN_CHOICES,
        default='UNKNOWN',
        verbose_name="Alteraciones intestinales (SIBO, disbiosis, SII, gases)"
    )
    
    # Pregunta 10: Tabaquismo
    is_smoker = models.CharField(
        max_length=10,
        choices=SMOKING_CHOICES,
        default='NO',
        verbose_name="Tabaquismo activo"
    )
    
    # Pregunta 11: Alcohol
    alcohol_consumption = models.CharField(
        max_length=15,
        choices=ALCOHOL_CHOICES,
        default='NO',
        verbose_name="Consumo habitual de alcohol"
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
        max_length=3,  # 🆕 CAMBIADO DE 1 A 3 para soportar F2, F3, F4
        choices=SCENARIO_CHOICES,  # 🆕 AGREGADO choices
        blank=True, 
        null=True,
        verbose_name="Escenario diagnóstico"
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