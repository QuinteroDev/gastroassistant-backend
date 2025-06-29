# questionnaires/views.py (Añadir las siguientes vistas)
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import (
    Questionnaire, Question, AnswerOption, UserAnswer, QuestionnaireCompletion,
    HabitQuestion, HabitOption, UserHabitAnswer
)
from .serializers import (
    QuestionnaireDetailSerializer, QuestionnaireSubmitSerializer,
    HabitQuestionSerializer, UserHabitAnswerSerializer
)
from habits.models import HabitTracker
from recommendations.services import HabitTrackingService

# --- Vistas para cuestionarios existentes ---

class QuestionnaireDetailView(generics.RetrieveAPIView):
    """
    Vista para obtener (GET) los detalles y preguntas
    de un cuestionario específico por su ID (pk).
    """
    serializer_class = QuestionnaireDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = Questionnaire.objects.prefetch_related('questions__options').all()

    def get_queryset(self):
         return Questionnaire.objects.prefetch_related('questions__options').all()
    
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

    @transaction.atomic
    def post(self, request, pk):
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

                try:
                    question = Question.objects.select_related('questionnaire').get(pk=question_id)
                    option = AnswerOption.objects.get(pk=option_id, question=question)
                except (Question.DoesNotExist, AnswerOption.DoesNotExist):
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
                # Sumar al score si aplica
                if questionnaire.type in ['GERDQ', 'RSI']:
                    total_score += option.value

            # 2. Crear todas las respuestas nuevas eficientemente
            UserAnswer.objects.bulk_create(answers_to_create)

            # 3. Crear el registro de finalización
            completion = QuestionnaireCompletion.objects.create(
                user=user,
                questionnaire=questionnaire,
                score=total_score if questionnaire.type in ['GERDQ', 'RSI'] else None,
                is_onboarding=True
            )

            # 4. Intentar asignar un programa si ya completó ambos cuestionarios
            assign_program = False
            if questionnaire.type in ['GERDQ', 'RSI']:
                # Verificar si el usuario ha completado ambos cuestionarios
                gerdq_done = QuestionnaireCompletion.objects.filter(
                    user=user, 
                    questionnaire__type='GERDQ'
                ).exists()
                
                rsi_done = QuestionnaireCompletion.objects.filter(
                    user=user, 
                    questionnaire__type='RSI'
                ).exists()
                
                if gerdq_done and rsi_done:
                    assign_program = True
                        
            if assign_program:
                # Primero, clasificar al usuario según la guía ERGE 2019
                from profiles.services import PhenotypeClassificationService
                phenotype_result = PhenotypeClassificationService.classify_user(user)
                
                # Luego, asignar programa basado en la clasificación
                from programs.services import ProgramAssignmentService
                user_program = ProgramAssignmentService.assign_program(user)
                
                # Si se asignó correctamente, incluir información en la respuesta
                if user_program:
                    response_data = {
                        "message": f"Respuestas para '{questionnaire.title}' enviadas correctamente.",
                        "completion_id": completion.id,
                        "phenotype": {
                            "code": phenotype_result['phenotype'],
                            "scenario": phenotype_result['scenario']
                        },
                    }
                else:
                    response_data = {
                        "message": f"Respuestas para '{questionnaire.title}' enviadas correctamente.",
                        "completion_id": completion.id,
                        "phenotype": {
                            "code": phenotype_result['phenotype'],
                            "scenario": phenotype_result['scenario']
                        },
                        "warning": "No se pudo asignar un programa automáticamente."
                    }
            else:
                # Respuesta estándar sin asignación de programa
                response_data = {
                    "message": f"Respuestas para '{questionnaire.title}' enviadas correctamente.",
                    "completion_id": completion.id,
                }
            
            # 5. Marcar el onboarding como completo si ha terminado todos los cuestionarios
            try:
                user_profile = user.profile
                if not user_profile.onboarding_complete:
                    # Verificar si ha completado todos los cuestionarios necesarios
                    all_questionnaires_done = all([
                        QuestionnaireCompletion.objects.filter(
                            user=user,
                            questionnaire__type=q_type,
                            is_onboarding=True
                        ).exists()
                        for q_type in ['GERDQ', 'RSI', 'HABITS']  # Añadir HABITS aquí
                    ])
                    
                    # También verificar si completó la información básica
                    profile_complete = (
                        user_profile.weight_kg is not None and
                        user_profile.height_cm is not None
                    )
                    
                    if all_questionnaires_done and profile_complete:
                        user_profile.onboarding_complete = True
                        user_profile.save()
                        response_data["onboarding_complete"] = True
            except Exception as e:
                # Si hay algún error actualizando el perfil, solo lo registramos
                print(f"Error al actualizar estado de onboarding: {e}")

            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class UserQuestionnaireCompletionsView(APIView):
    """
    Vista para obtener los completions de cuestionarios del usuario actual.
    Esto es útil para verificar las puntuaciones y estado de los cuestionarios.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        completions = QuestionnaireCompletion.objects.filter(user=user).select_related('questionnaire')
        
        data = []
        for completion in completions:
            data.append({
                'id': completion.id,
                'questionnaire': {
                    'id': completion.questionnaire.id,
                    'name': completion.questionnaire.name,
                    'title': completion.questionnaire.title,
                    'type': completion.questionnaire.type,
                },
                'score': completion.score,
                'is_onboarding': completion.is_onboarding,
                'completed_at': completion.completed_at,
            })
            
        return Response(data)

# --- Nuevas vistas para hábitos ---

class HabitQuestionsView(generics.ListAPIView):
    """
    Vista para obtener todas las preguntas del cuestionario de hábitos.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = HabitQuestionSerializer
    queryset = HabitQuestion.objects.prefetch_related('options').all()

# questionnaires/views.py
# Modificar la clase SubmitHabitQuestionnaireView para asegurar que se marca correctamente el onboarding como completo

class SubmitHabitQuestionnaireView(APIView):
    """
    Vista para enviar las respuestas al cuestionario de hábitos.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Espera un JSON como:
        {
            "answers": [
                {"question_id": 1, "option_id": 3},
                {"question_id": 2, "option_id": 1},
                ...
            ]
        }
        """
        answers_data = request.data.get('answers', [])
        if not answers_data:
            return Response({
                'error': 'No se proporcionaron respuestas'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validar y guardar las respuestas
        saved_answers = []
        for answer in answers_data:
            question_id = answer.get('question_id')
            option_id = answer.get('option_id')
            try:
                question = HabitQuestion.objects.get(id=question_id)
                option = HabitOption.objects.get(id=option_id, question=question)
            except (HabitQuestion.DoesNotExist, HabitOption.DoesNotExist):
                return Response({
                    'error': f'Pregunta u opción inválida: {question_id}, {option_id}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Guardar la respuesta
            user_answer, created = UserHabitAnswer.objects.update_or_create(
                user=request.user,
                question=question,
                is_onboarding=True,
                defaults={'selected_option': option}
            )
            saved_answers.append(user_answer)

        # NUEVO: Crear un registro de completion para el cuestionario de hábitos
        try:
            # Obtener o crear el cuestionario de hábitos
            habits_questionnaire, _ = Questionnaire.objects.get_or_create(
                type='HABITS',
                defaults={
                    'name': 'Cuestionario de Hábitos',
                    'title': 'Hábitos Digestivos',
                    'description': 'Preguntas sobre hábitos relacionados con la salud digestiva.'
                }
            )

            # Crear un registro de finalización para este cuestionario
            completion = QuestionnaireCompletion.objects.create(
                user=request.user,
                questionnaire=habits_questionnaire,
                score=None,  # No hay puntaje para los hábitos
                is_onboarding=True
            )

            # Verificar si ya completó todos los demás cuestionarios requeridos
            gerdq_done = QuestionnaireCompletion.objects.filter(
                user=request.user,
                questionnaire__type='GERDQ',
                is_onboarding=True
            ).exists()

            rsi_done = QuestionnaireCompletion.objects.filter(
                user=request.user,
                questionnaire__type='RSI',
                is_onboarding=True
            ).exists()

            # Verificar si el perfil tiene la información básica
            user_profile = request.user.profile
            profile_complete = (
                user_profile.weight_kg is not None and
                user_profile.height_cm is not None
            )

            # Si ha completado todo lo necesario, marcar el onboarding como completo
            if gerdq_done and rsi_done and profile_complete:
                user_profile.onboarding_complete = True
                user_profile.save(update_fields=['onboarding_complete'])
                print(f"✅ Onboarding completado para usuario {request.user.username}")
                
                # Intentar guardar de nuevo para garantizar que se guarda
                try:
                    from django.db import transaction
                    with transaction.atomic():
                        profile_refresh = UserProfile.objects.select_for_update().get(id=user_profile.id)
                        profile_refresh.onboarding_complete = True
                        profile_refresh.save(update_fields=['onboarding_complete'])
                        print(f"✅✅ Verificación adicional de guardado exitosa")
                except Exception as retry_error:
                    print(f"⚠️ Error en intento adicional: {retry_error}")
                    
        except Exception as e:
            print(f"Error al procesar completion de hábitos: {e}")
            # Continuar con el proceso aunque haya un error

        # Configurar el seguimiento de hábitos para el usuario
        from recommendations.services import HabitTrackingService
        trackers = HabitTrackingService.setup_habit_tracking(request.user)

        # Generar recomendaciones basadas en el perfil actual
        from recommendations.services import RecommendationService
        recommendations = RecommendationService.generate_recommendations_for_user(request.user)
        prioritized = RecommendationService.prioritize_recommendations(request.user)
        
        # Verificar estado final
        final_status = getattr(request.user.profile, 'onboarding_complete', False)
        
        return Response({
            'message': 'Respuestas guardadas con éxito.',
            'answers_count': len(saved_answers),
            'trackers_created': len(trackers),
            'recommendations_generated': len(recommendations),
            'prioritized_recommendations': len(prioritized),
            'onboarding_complete': final_status
        }, status=status.HTTP_201_CREATED)