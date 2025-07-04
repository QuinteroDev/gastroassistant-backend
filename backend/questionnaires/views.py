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
    

# questionnaires/views.py - Añadir estas nuevas vistas

class ClinicalFactorsQuestionnaireView(APIView):
    """
    Vista para obtener el cuestionario de factores clínicos.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Buscar el cuestionario de factores clínicos
            questionnaire = Questionnaire.objects.prefetch_related(
                'questions__options'
            ).get(name='Clinical_Factors_v1')
            
            serializer = QuestionnaireDetailSerializer(questionnaire)
            return Response(serializer.data)
            
        except Questionnaire.DoesNotExist:
            return Response({
                'error': 'Cuestionario de factores clínicos no encontrado',
                'hint': 'Ejecuta: python manage.py create_clinical_factors'
            }, status=status.HTTP_404_NOT_FOUND)


class SubmitClinicalFactorsView(APIView):
    """
    Vista para enviar las respuestas del cuestionario de factores clínicos.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        try:
            questionnaire = Questionnaire.objects.get(name='Clinical_Factors_v1')
        except Questionnaire.DoesNotExist:
            return Response({
                'error': 'Cuestionario de factores clínicos no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = QuestionnaireSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_answers = serializer.validated_data['answers']
        user = request.user
        answers_to_create = []
        
        # Mapeo de preguntas a campos del perfil
        question_to_field_mapping = {
            1: 'has_hernia',                # Hernia de hiato
            2: 'has_gastritis',             # Gastritis
            3: 'h_pylori_status',           # Helicobacter pylori
            4: 'has_altered_motility',      # Motilidad alterada  
            5: 'has_slow_emptying',         # Vaciamiento lento
            6: 'has_dry_mouth',             # Sequedad bucal
            7: 'has_constipation',          # Estreñimiento
            8: 'stress_affects',            # Estrés
            9: 'has_intestinal_disorders',  # Alteraciones intestinales
        }

        # Diccionario para almacenar los valores a actualizar en el perfil
        profile_updates = {}

        # 1. Validar y preparar UserAnswer para bulk_create
        for answer_data in validated_answers:
            question_id = answer_data['question_id']
            option_id = answer_data['selected_option_id']

            try:
                question = Question.objects.select_related('questionnaire').get(pk=question_id)
                option = AnswerOption.objects.get(pk=option_id, question=question)
            except (Question.DoesNotExist, AnswerOption.DoesNotExist):
                return Response({
                    'error': f'Datos inválidos para pregunta {question_id} u opción {option_id}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verificar que la pregunta pertenece al cuestionario correcto
            if question.questionnaire != questionnaire:
                return Response({
                    'error': f'La pregunta {question_id} no pertenece al cuestionario de factores clínicos'
                }, status=status.HTTP_400_BAD_REQUEST)

            answers_to_create.append(
                UserAnswer(
                    user=user,
                    question=question,
                    selected_option=option
                )
            )

            # Mapear el valor de la respuesta al campo correspondiente del perfil
            if question.order in question_to_field_mapping:
                field_name = question_to_field_mapping[question.order]
                
                # Convertir el valor numérico a string según el campo
                if field_name == 'h_pylori_status':
                    # Helicobacter pylori: 0=NO, 1=UNKNOWN, 2=TREATED, 3=ACTIVE
                    value_mapping = {0: 'NO', 1: 'UNKNOWN', 2: 'TREATED', 3: 'ACTIVE'}
                    profile_updates[field_name] = value_mapping.get(option.value, 'UNKNOWN')
                    
                elif field_name == 'stress_affects':
                    # Estrés: 0=NO, 1=SOMETIMES, 2=YES
                    value_mapping = {0: 'NO', 1: 'SOMETIMES', 2: 'YES'}
                    profile_updates[field_name] = value_mapping.get(option.value, 'NO')
                    
                elif field_name == 'alcohol_consumption':
                    # Alcohol: 0=NO, 1=OCCASIONALLY, 2=YES
                    value_mapping = {0: 'NO', 1: 'SOMETIMES', 2: 'YES'}
                    profile_updates[field_name] = value_mapping.get(option.value, 'NO')
        
                elif field_name == 'is_smoker':
                    # Tabaquismo: 0=NO, 1=YES
                    value_mapping = {0: 'NO', 1: 'YES'}
                    profile_updates[field_name] = value_mapping.get(option.value, 'NO')
                    
                else:
                    # Para el resto (YES/NO/UNKNOWN): 0=NO, 1=YES, 2=UNKNOWN
                    value_mapping = {0: 'NO', 1: 'YES', 2: 'UNKNOWN'}
                    profile_updates[field_name] = value_mapping.get(option.value, 'UNKNOWN')

        # 2. Crear todas las respuestas
        UserAnswer.objects.bulk_create(answers_to_create)

        # 3. Actualizar el perfil del usuario con los factores clínicos
        try:
            user_profile = user.profile
            for field_name, field_value in profile_updates.items():
                setattr(user_profile, field_name, field_value)
            
            user_profile.save()
            
            print(f'✅ Perfil actualizado para {user.username}: {profile_updates}')
            
        except Exception as e:
            return Response({
                'error': f'Error actualizando perfil: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 4. Crear el registro de finalización
        completion = QuestionnaireCompletion.objects.create(
            user=user,
            questionnaire=questionnaire,
            score=None,  # Los factores clínicos no tienen score
            is_onboarding=True
        )

        # 5. Verificar si debe completar el onboarding
        try:
            # Verificar si ha completado todos los cuestionarios necesarios
            gerdq_done = QuestionnaireCompletion.objects.filter(
                user=user,
                questionnaire__type='GERDQ',
                is_onboarding=True
            ).exists()

            rsi_done = QuestionnaireCompletion.objects.filter(
                user=user,
                questionnaire__type='RSI',
                is_onboarding=True
            ).exists()

            habits_done = QuestionnaireCompletion.objects.filter(
                user=user,
                questionnaire__type='HABITS',
                is_onboarding=True
            ).exists()

            # Verificar información básica del perfil
            profile_complete = (
                user_profile.weight_kg is not None and
                user_profile.height_cm is not None
            )

            # Si completó todo, marcar onboarding como terminado
            all_complete = gerdq_done and rsi_done and habits_done and profile_complete
            
            if all_complete:
                user_profile.onboarding_complete = True
                user_profile.save(update_fields=['onboarding_complete'])
                
                # Generar recomendaciones y configurar hábitos
                from recommendations.services import RecommendationService, HabitTrackingService
                
                # Generar recomendaciones basadas en factores clínicos
                recommendations = RecommendationService.generate_recommendations_for_user(user)
                prioritized = RecommendationService.prioritize_recommendations(user)
                
                # Configurar seguimiento de hábitos
                trackers, promoted_habit = HabitTrackingService.setup_habit_tracking(user)
                
                return Response({
                    'message': 'Factores clínicos guardados correctamente',
                    'completion_id': completion.id,
                    'profile_updated': profile_updates,
                    'onboarding_complete': True,
                    'recommendations_generated': len(recommendations),
                    'prioritized_recommendations': len(prioritized),
                    'habit_trackers_created': len(trackers),
                    'promoted_habit': promoted_habit.habit.habit_type if promoted_habit else None
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f'Error en configuración post-onboarding: {e}')

        return Response({
            'message': 'Factores clínicos guardados correctamente',
            'completion_id': completion.id,
            'profile_updated': profile_updates,
            'onboarding_complete': False
        }, status=status.HTTP_201_CREATED)