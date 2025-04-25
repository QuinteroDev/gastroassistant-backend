# questionnaires/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Questionnaire
from .serializers import QuestionnaireDetailSerializer
from django.shortcuts import get_object_or_404 # Para manejar 404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction # Importante para la atomicidad
from .models import Question, AnswerOption, UserAnswer, QuestionnaireCompletion # Importar modelos necesarios
from .serializers import QuestionnaireSubmitSerializer # Importar el nuevo serializer

class QuestionnaireDetailView(generics.RetrieveAPIView):
    """
    Vista para obtener (GET) los detalles y preguntas
    de un cuestionario específico por su ID (pk).
    """
    serializer_class = QuestionnaireDetailSerializer
    permission_classes = [IsAuthenticated] # Solo usuarios logueados
    queryset = Questionnaire.objects.prefetch_related('questions__options').all()
    # lookup_field = 'pk' # 'pk' es el default, podrías cambiar a 'name' si prefieres buscar por nombre

    # Opcional: Si quieres buscar por 'name' en lugar de 'pk' en la URL
    # lookup_field = 'name'
    # queryset = Questionnaire.objects.prefetch_related('questions__options').all()

    # Optimizamos la consulta para traer preguntas y opciones eficientemente
    def get_queryset(self):
         return Questionnaire.objects.prefetch_related('questions__options').all()

# --- Alternativa con function-based view si prefieres ---
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.response import Response
#
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_questionnaire_detail(request, pk): # o 'name' si usas lookup_field='name'
#     questionnaire = get_object_or_404(Questionnaire.objects.prefetch_related('questions__options'), pk=pk)
#     serializer = QuestionnaireDetailSerializer(questionnaire)
#     return Response(serializer.data)

# Añadir esta vista
class SubmitQuestionnaireAnswersView(APIView):
    """
    Vista para recibir (POST) las respuestas de un usuario a un cuestionario específico.
    Espera un JSON como:
    {
      "answers": [
        {"question_id": 1, "selected_option_id": 3},
        {"question_id": 2, "selected_option_id": 5},
        ...
      ]
    }
    La URL debe incluir el ID (pk) del cuestionario.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic # Asegura que todas las operaciones de BD se hagan juntas o ninguna
    def post(self, request, pk): # 'pk' es el ID del Questionnaire desde la URL
        try:
            questionnaire = Questionnaire.objects.get(pk=pk)
        except Questionnaire.DoesNotExist:
            return Response({"error": "Cuestionario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuestionnaireSubmitSerializer(data=request.data)
        if serializer.is_valid():
            validated_answers = serializer.validated_data['answers']
            user = request.user
            total_score = 0
            answers_to_create = []

            # 1. Validar y preparar UserAnswer para bulk_create
            for answer_data in validated_answers:
                question_id = answer_data['question_id']
                option_id = answer_data['selected_option_id']

                # Re-validar aquí o confiar en la validación del serializer
                # Es más seguro re-validar por si acaso
                try:
                    question = Question.objects.select_related('questionnaire').get(pk=question_id)
                    option = AnswerOption.objects.get(pk=option_id, question=question)
                except (Question.DoesNotExist, AnswerOption.DoesNotExist):
                    # Esto no debería pasar si el serializer validó bien, pero por si acaso
                    return Response({"error": f"Datos inválidos para pregunta {question_id} u opción {option_id}"}, status=status.HTTP_400_BAD_REQUEST)

                # Asegurarse que la pregunta pertenece al cuestionario de la URL
                if question.questionnaire != questionnaire:
                     return Response({"error": f"La pregunta {question_id} no pertenece al cuestionario {pk}"}, status=status.HTTP_400_BAD_REQUEST)

                answers_to_create.append(
                    UserAnswer(
                        user=user,
                        question=question,
                        selected_option=option
                    )
                )
                # Sumar al score si aplica (podría hacerse después también)
                if questionnaire.type in ['GERDQ', 'RSI']:
                    total_score += option.value

            # 2. Borrar respuestas anteriores de ESTE usuario para ESTE cuestionario (si se permite re-submit)
            # UserAnswer.objects.filter(user=user, question__questionnaire=questionnaire).delete()

            # 3. Crear todas las respuestas nuevas eficientemente
            UserAnswer.objects.bulk_create(answers_to_create)

            # 4. Crear el registro de finalización
            # Asumimos que esta sumisión es parte del onboarding.
            # Si no fuera siempre así, el frontend debería indicarlo.
            completion = QuestionnaireCompletion.objects.create(
                user=user,
                questionnaire=questionnaire,
                score=total_score if questionnaire.type in ['GERDQ', 'RSI'] else None,
                is_onboarding=True # Marcar como parte del onboarding
            )

            # 5. (Lógica futura) Verificar si el onboarding está completo
            # check_and_update_onboarding_status(user)

            # 6. Devolver respuesta (puedes incluir el score o un mensaje)
            response_data = {
                "message": f"Respuestas para '{questionnaire.title}' enviadas correctamente.",
                "completion_id": completion.id,
            }
            if questionnaire.type in ['GERDQ', 'RSI']:
                response_data["score"] = total_score
                # Aquí podrías añadir lógica para determinar el emoji basado en el score

            return Response(response_data, status=status.HTTP_201_CREATED)

        else:
            # Si la validación del serializer falla
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# (Función auxiliar placeholder para futura lógica de completar onboarding)
# def check_and_update_onboarding_status(user):
#     profile = user.profile
#     if not profile.onboarding_complete:
#         # Verificar si todas las QuestionnaireCompletion necesarias con is_onboarding=True existen
#         gerdq_done = QuestionnaireCompletion.objects.filter(user=user, questionnaire__type='GERDQ', is_onboarding=True).exists()
#         rsi_done = QuestionnaireCompletion.objects.filter(user=user, questionnaire__type='RSI', is_onboarding=True).exists()
#         habits_done = QuestionnaireCompletion.objects.filter(user=user, questionnaire__type='HABITS', is_onboarding=True).exists()
#         # Asumiendo que también hay un paso de datos generales...
#         # general_data_done = profile.weight_kg is not None and profile.height_cm is not None # O un flag específico

#         if gerdq_done and rsi_done and habits_done: # Añadir más condiciones si es necesario
#             profile.onboarding_complete = True
#             profile.save()