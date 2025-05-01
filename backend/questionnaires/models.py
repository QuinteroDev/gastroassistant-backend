# questionnaires/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Questionnaire(models.Model):
    # Usamos CharField con Choices para identificar el tipo de cuestionario
    QUESTIONNAIRE_TYPES = [
        ('GERDQ', 'Cuestionario GerdQ'),
        ('RSI', 'Índice de Síntomas de Reflujo (RSI)'),
        ('HABITS', 'Cuestionario de Hábitos'),
        ('GENERAL', 'Datos Generales Onboarding'), # Podríamos tratarlo como un cuestionario más
    ]
    name = models.CharField(max_length=100, unique=True) # Ej: "GerdQ_v1", "RSI_v1"
    title = models.CharField(max_length=200) # Ej: "Cuestionario GerdQ"
    type = models.CharField(max_length=10, choices=QUESTIONNAIRE_TYPES, default='GENERAL')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    questionnaire = models.ForeignKey(Questionnaire, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    # Podrías añadir un tipo de pregunta (ej: multiple_choice, number_input, text) si es necesario
    # question_type = models.CharField(max_length=20, default='multiple_choice')
    order = models.PositiveIntegerField(default=0, help_text="Orden de la pregunta en el cuestionario")

    class Meta:
        ordering = ['order'] # Ordenar preguntas por el campo 'order'

    def __str__(self):
        return f"{self.questionnaire.name} - Q{self.order}: {self.text[:50]}..."

class AnswerOption(models.Model):
    """Opciones de respuesta para preguntas de opción múltiple"""
    question = models.ForeignKey(Question, related_name='options', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    # Valor numérico asociado a la opción (importante para calcular scores)
    value = models.IntegerField(default=0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.question.text[:30]}... - Opt: {self.text} ({self.value})"

class UserAnswer(models.Model):
    """Respuesta de un usuario a una pregunta específica"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    # Guardamos la opción seleccionada si es de opción múltiple
    selected_option = models.ForeignKey(AnswerOption, null=True, blank=True, on_delete=models.SET_NULL)
    # O guardamos un valor directo si es numérica o de texto (adaptar según tipos de pregunta)
    # answer_value = models.TextField(null=True, blank=True)
    answered_at = models.DateTimeField(auto_now_add=True)

    # Podríamos añadir un campo para agrupar respuestas de una misma "sesión" de cuestionario
    # session_id = models.UUIDField(default=uuid.uuid4, editable=False)

    def __str__(self):
        return f"{self.user.username} - {self.question.text[:30]}... -> {self.selected_option.text if self.selected_option else 'N/A'}"

class QuestionnaireCompletion(models.Model):
    """Registro de cuándo un usuario completa un cuestionario y su resultado"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='completions')
    questionnaire = models.ForeignKey(Questionnaire, on_delete=models.CASCADE)
    score = models.IntegerField(null=True, blank=True, help_text="Puntuación calculada (para GerdQ/RSI)")
    # Aquí podríamos guardar el emoji correspondiente al score
    # result_emoji = models.CharField(max_length=10, null=True, blank=True)
    completed_at = models.DateTimeField(auto_now_add=True)
    # Flag para saber si esta completion fue parte del onboarding inicial
    is_onboarding = models.BooleanField(default=False)

    class Meta:
        # Evitar que un usuario complete el mismo cuestionario de onboarding múltiples veces?
        # unique_together = ('user', 'questionnaire', 'is_onboarding') # O ajustar según lógica
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.username} completed {self.questionnaire.name} at {self.completed_at} (Score: {self.score})"
    
class HabitQuestion(models.Model):
    """
    Preguntas del cuestionario de hábitos modificables para ERGE.
    Cada pregunta tiene un código, texto y se califica de 0 a 3.
    """
    HABIT_TYPES = [
        ('MEAL_SIZE', 'Cantidad de comida ingerida'),
        ('DINNER_TIME', 'Tiempo entre cena y acostarse'),
        ('LIE_DOWN', 'Acostarse tras comer'),
        ('NIGHT_SYMPTOMS', 'Síntomas nocturnos'),
        ('SMOKING', 'Consumo de tabaco'),
        ('ALCOHOL', 'Consumo de alcohol'),
        ('EXERCISE', 'Ejercicio físico regular'),
        ('AVOID_TRIGGERS', 'Evitar alimentos que sientan mal'),
        ('STRESS', 'Estrés y salud digestiva'),
        ('HYDRATION_MEALS', 'Hidratación durante las comidas'),
        ('HYDRATION_DAY', 'Hidratación general durante el día'),
        ('CHEWING', 'Masticación de los alimentos')
    ]
    
    habit_type = models.CharField(
        max_length=20, 
        choices=HABIT_TYPES,
        unique=True,
        verbose_name="Tipo de hábito"
    )
    text = models.CharField(max_length=255, verbose_name="Pregunta")
    description = models.TextField(blank=True, verbose_name="Descripción adicional")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_habit_type_display()}"
    
    class Meta:
        ordering = ['id']
        verbose_name = "Pregunta de hábito"
        verbose_name_plural = "Preguntas de hábitos"

class HabitOption(models.Model):
    """
    Opciones de respuesta para cada pregunta del cuestionario de hábitos.
    Cada opción tiene un valor de 0 a 3, donde 3 es el mejor cumplimiento.
    """
    question = models.ForeignKey(
        HabitQuestion, 
        on_delete=models.CASCADE, 
        related_name='options',
        verbose_name="Pregunta"
    )
    text = models.CharField(max_length=255, verbose_name="Texto de la opción")
    value = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        verbose_name="Valor (0-3)"
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")
    
    def __str__(self):
        return f"{self.question} - {self.text} ({self.value})"
    
    class Meta:
        ordering = ['question', 'order']
        verbose_name = "Opción de hábito"
        verbose_name_plural = "Opciones de hábitos"

class UserHabitAnswer(models.Model):
    """
    Respuestas del usuario al cuestionario de hábitos.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='habit_answers',
        verbose_name="Usuario"
    )
    question = models.ForeignKey(
        HabitQuestion,
        on_delete=models.CASCADE,
        verbose_name="Pregunta de hábito"
    )
    selected_option = models.ForeignKey(
        HabitOption,
        on_delete=models.CASCADE,
        verbose_name="Opción seleccionada"
    )
    answered_at = models.DateTimeField(auto_now_add=True)
    is_onboarding = models.BooleanField(default=True, verbose_name="Es parte del onboarding")
    
    def __str__(self):
        return f"{self.user.username} - {self.question.get_habit_type_display()} ({self.selected_option.value})"
    
    class Meta:
        unique_together = ('user', 'question', 'is_onboarding')
        ordering = ['-answered_at']
        verbose_name = "Respuesta de hábito del usuario"
        verbose_name_plural = "Respuestas de hábitos del usuario"

class HabitRecommendation(models.Model):
    """
    Recomendaciones basadas en los hábitos del usuario.
    Se activarán según la puntuación en cada hábito.
    """
    habit_type = models.CharField(
        max_length=20, 
        choices=HabitQuestion.HABIT_TYPES,
        verbose_name="Tipo de hábito"
    )
    title = models.CharField(max_length=255, verbose_name="Título")
    content = models.TextField(verbose_name="Contenido de la recomendación")
    min_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        verbose_name="Puntuación mínima para activar"
    )
    max_score = models.IntegerField(
        default=3,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        verbose_name="Puntuación máxima para activar"
    )
    is_active = models.BooleanField(default=True, verbose_name="Está activa")
    
    def __str__(self):
        return f"{self.get_habit_type_display()} ({self.min_score}-{self.max_score})"
    
    class Meta:
        ordering = ['habit_type', 'min_score']
        verbose_name = "Recomendación de hábito"
        verbose_name_plural = "Recomendaciones de hábitos"