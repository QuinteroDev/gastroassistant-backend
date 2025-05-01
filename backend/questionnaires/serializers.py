# questionnaires/serializers.py
from rest_framework import serializers
from .models import Questionnaire, Question, AnswerOption
from .models import HabitQuestion, HabitOption, UserHabitAnswer # Asegúrate de importar los modelos necesarios

class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ['id', 'text', 'value', 'order'] # Incluimos 'id' por si el frontend lo necesita

class QuestionSerializer(serializers.ModelSerializer):
    # Anidamos las opciones de respuesta dentro de cada pregunta
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'options'] # Incluimos 'id'

class QuestionnaireDetailSerializer(serializers.ModelSerializer):
    # Anidamos las preguntas (con sus opciones) dentro del cuestionario
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Questionnaire
        fields = ['id', 'name', 'title', 'type', 'description', 'questions'] # Incluimos 'id'


    
# questionnaires/serializers.py
# ... (importaciones existentes y otros serializers) ...
from .models import Question, AnswerOption # Asegúrate de importar Question y AnswerOption

# Serializer para una única respuesta dentro de la lista
class UserAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField()
    # Si tuvieras preguntas de texto libre, añadirías aquí:
    # answer_text = serializers.CharField(required=False, allow_blank=True)

    # Validación a nivel de cada respuesta individual (opcional pero recomendable)
    def validate(self, data):
        try:
            question = Question.objects.get(pk=data['question_id'])
        except Question.DoesNotExist:
            raise serializers.ValidationError(f"La pregunta con ID {data['question_id']} no existe.")

        try:
            option = AnswerOption.objects.get(pk=data['selected_option_id'], question=question)
        except AnswerOption.DoesNotExist:
            raise serializers.ValidationError(f"La opción con ID {data['selected_option_id']} no es válida para la pregunta {question.id}.")

        # Guardamos las instancias para usarlas luego en la vista si es necesario
        # data['question_instance'] = question
        # data['option_instance'] = option
        return data

# Serializer principal para la petición de envío
class QuestionnaireSubmitSerializer(serializers.Serializer):
    answers = UserAnswerInputSerializer(many=True)

class HabitOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitOption
        fields = ['id', 'text', 'value', 'order']

class HabitQuestionSerializer(serializers.ModelSerializer):
    options = HabitOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = HabitQuestion
        fields = ['id', 'habit_type', 'text', 'description', 'options']

class UserHabitAnswerSerializer(serializers.ModelSerializer):
    question = HabitQuestionSerializer(read_only=True)
    selected_option = HabitOptionSerializer(read_only=True)
    
    class Meta:
        model = UserHabitAnswer
        fields = ['id', 'question', 'selected_option', 'answered_at', 'is_onboarding']
