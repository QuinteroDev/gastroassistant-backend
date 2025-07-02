# habits/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.utils import timezone
from django.db.models import Prefetch
from questionnaires.models import HabitQuestion, UserHabitAnswer, HabitOption
from questionnaires.serializers import HabitQuestionSerializer, UserHabitAnswerSerializer
from .models import HabitTracker, HabitLog, DailyNote
from .serializers import HabitTrackerSerializer, HabitLogSerializer, DailyNoteSerializer
from recommendations.services import HabitTrackingService
from recommendations.services import RecommendationService

from gamification.services import GamificationService


class HabitQuestionsView(generics.ListAPIView):
    """
    Vista para obtener todas las preguntas del cuestionario de hábitos.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = HabitQuestionSerializer
    queryset = HabitQuestion.objects.prefetch_related('options').all()

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
        
        # Configurar el seguimiento de hábitos para el usuario
        trackers, promoted_habit = HabitTrackingService.setup_habit_tracking(request.user)
        
        # Generar recomendaciones
        recommendations = RecommendationService.generate_recommendations_for_user(request.user)
        prioritized = RecommendationService.prioritize_recommendations(request.user)
        
        # Preparar respuesta con información del hábito promocionado
        response_data = {
            'message': 'Respuestas guardadas con éxito.',
            'answers_count': len(saved_answers),
            'trackers_created': len(trackers),
            'recommendations_generated': len(recommendations),
            'prioritized_recommendations': len(prioritized),
            'onboarding_complete': True
        }
        
        # Añadir información del hábito promocionado si existe
        if promoted_habit:
            response_data['promoted_habit'] = {
                'id': promoted_habit.id,
                'habit_type': promoted_habit.habit.habit_type,
                'habit_name': promoted_habit.habit.text,
                'current_score': promoted_habit.current_score,
                'is_promoted': promoted_habit.is_promoted
            }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class UserHabitTrackersView(generics.ListAPIView):
    """
    Vista para obtener los hábitos que el usuario está siguiendo.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = HabitTrackerSerializer
    
    def get_queryset(self):
        # Prefetch streak para cada tracker
        return HabitTracker.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('habit').prefetch_related('streak')

class HabitLogView(APIView):
    """
    Vista para registrar el cumplimiento de un hábito.
    MODIFICADA: Ahora incluye cálculo de gamificación
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Registra un hábito y actualiza gamificación automáticamente
        """
        habit_id = request.data.get('habit_id')
        date_str = request.data.get('date')
        completion_level = request.data.get('completion_level')
        notes = request.data.get('notes', '')
        
        # Validaciones básicas (mismo código que antes)
        if habit_id is None or completion_level is None:
            return Response({
                'error': 'Se requieren habit_id y completion_level'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            completion_level = int(completion_level)
            if completion_level < 0 or completion_level > 3:
                raise ValueError()
        except ValueError:
            return Response({
                'error': 'completion_level debe ser un número entre 0 y 3'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Procesar fecha
        if date_str:
            try:
                from datetime import datetime
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            date = timezone.now().date()
        
        # Registrar el hábito (código existente)
        log = HabitTrackingService.log_habit(
            user=request.user,
            habit_id=habit_id,
            date=date,
            completion_level=completion_level,
            notes=notes
        )
        
        if not log:
            return Response({
                'error': 'No se pudo registrar el hábito'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # NUEVO: Procesar gamificación después de registrar el hábito
        try:
            gamification_result = GamificationService.process_daily_gamification(
                user=request.user,
                target_date=date
            )
            
            # Preparar respuesta con datos de gamificación
            response_data = {
                'message': 'Hábito registrado con éxito',
                'habit_data': HabitLogSerializer(log).data,
                'gamification': {
                    'points_earned_today': gamification_result['daily_points'].total_points,
                    'total_cycle_points': gamification_result['user_level'].current_cycle_points,
                    'current_level': gamification_result['user_level'].current_level,
                    'current_streak': gamification_result['user_level'].current_streak,
                    'new_medals': len(gamification_result['new_medals']),
                    'level_up': gamification_result['level_up']
                }
            }
            
            # Añadir detalles de medallas nuevas si las hay
            if gamification_result['new_medals']:
                response_data['gamification']['medals_earned'] = [
                    {
                        'name': medal.medal.name,
                        'icon': medal.medal.icon,
                        'description': medal.medal.description
                    }
                    for medal in gamification_result['new_medals']
                ]
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Si falla la gamificación, aún devolver éxito del hábito
            # pero loggear el error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error en gamificación para usuario {request.user.id}: {str(e)}")
            
            return Response({
                'message': 'Hábito registrado con éxito',
                'habit_data': HabitLogSerializer(log).data,
                'gamification_error': 'Error calculando puntos, pero el hábito se guardó correctamente'
            }, status=status.HTTP_201_CREATED)

class HabitLogsHistoryView(generics.ListAPIView):
    """
    Vista para obtener el historial de logs de un hábito específico.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = HabitLogSerializer
    
    def get_queryset(self):
        habit_id = self.kwargs.get('habit_id')
        days = self.request.query_params.get('days', 30)
        
        try:
            days = int(days)
        except ValueError:
            days = 30
        
        start_date = timezone.now().date() - timezone.timedelta(days=days)
        
        return HabitLog.objects.filter(
            tracker__user=self.request.user,
            tracker__habit_id=habit_id,
            date__gte=start_date
        ).select_related('tracker').order_by('-date')
    
class DailyNoteView(APIView):
    """
    Vista para guardar y obtener las notas diarias.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Guardar nota diaria cuando se completan todos los hábitos.
        Espera un JSON como:
        {
            "date": "2023-06-15", (opcional, default=hoy)
            "notes": "Me sentí muy bien hoy...",
            "all_completed": true
        }
        """
        date_str = request.data.get('date')
        notes = request.data.get('notes', '')
        all_completed = request.data.get('all_completed', True)
        
        # Procesar fecha
        if date_str:
            try:
                from datetime import datetime
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            date = timezone.now().date()
        
        # Crear o actualizar la nota diaria
        daily_note, created = DailyNote.objects.update_or_create(
            user=request.user,
            date=date,
            defaults={
                'notes': notes,
                'all_habits_completed': all_completed
            }
        )
        
        return Response({
            'message': 'Nota diaria guardada con éxito',
            'data': DailyNoteSerializer(daily_note).data
        }, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        """
        Obtener la nota diaria para una fecha específica.
        Query params: ?date=2023-06-15
        """
        date_str = request.query_params.get('date')
        
        # Procesar fecha
        if date_str:
            try:
                from datetime import datetime
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            date = timezone.now().date()
        
        try:
            daily_note = DailyNote.objects.get(user=request.user, date=date)
            return Response(DailyNoteSerializer(daily_note).data)
        except DailyNote.DoesNotExist:
            return Response({
                'exists': False,
                'date': str(date)
            }, status=status.HTTP_404_NOT_FOUND)
        
class CheckAllHabitsCompletedView(APIView):
    """
    Vista para verificar si ya se completaron todos los hábitos del día
    y si ya se mostró el modal de celebración.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Verifica el estado de completado del día actual.
        """
        date = timezone.now().date()
        
        # Obtener todos los trackers activos del usuario
        active_trackers = HabitTracker.objects.filter(
            user=request.user,
            is_active=True
        )
        
        if not active_trackers.exists():
            return Response({
                'has_habits': False,
                'all_completed': False,
                'modal_shown': False
            })
        
        # Verificar logs del día
        logs_today = HabitLog.objects.filter(
            tracker__user=request.user,
            date=date
        ).values_list('tracker_id', flat=True)
        
        all_completed = set(logs_today) == set(active_trackers.values_list('id', flat=True))
        
        # Verificar si ya existe una nota diaria (indica que se mostró el modal)
        modal_shown = DailyNote.objects.filter(
            user=request.user,
            date=date
        ).exists()
        
        return Response({
            'has_habits': True,
            'all_completed': all_completed,
            'modal_shown': modal_shown,
            'completed_count': len(logs_today),
            'total_habits': active_trackers.count()
        })
