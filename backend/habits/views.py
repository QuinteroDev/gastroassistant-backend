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
from .models import HabitTracker, HabitLog, HabitStreak, DailyNote
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
    CORREGIDA: Implementación directa sin dependencia de HabitTrackingService.log_habit
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Registra un hábito y actualiza gamificación automáticamente
        """
        # Obtener datos del request
        tracker_id = request.data.get('tracker_id')
        habit_id = request.data.get('habit_id')
        date_str = request.data.get('date')
        completion_level = request.data.get('completion_level')
        notes = request.data.get('notes', '')
        
        # Validaciones básicas
        if completion_level is None:
            return Response({
                'error': 'Se requiere completion_level'
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
        
        # REGISTRO DIRECTO DEL HÁBITO (sin HabitTrackingService.log_habit)
        try:
            # Buscar el tracker
            if tracker_id:
                tracker = HabitTracker.objects.get(
                    id=tracker_id,
                    user=request.user,
                    is_active=True
                )
            elif habit_id:
                tracker = HabitTracker.objects.get(
                    habit_id=habit_id,
                    user=request.user,
                    is_active=True
                )
            else:
                return Response({
                    'error': 'Se requiere tracker_id o habit_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear o actualizar el log
            log, created = HabitLog.objects.update_or_create(
                tracker=tracker,
                date=date,
                defaults={
                    'completion_level': completion_level,
                    'notes': notes
                }
            )
            
            # Actualizar streak si es necesario
            self._update_habit_streak(tracker, date, completion_level)
            
            print(f"✅ Hábito registrado: {log.id} - Nivel: {completion_level}")
            
        except HabitTracker.DoesNotExist:
            return Response({
                'error': 'No se encontró el tracker del hábito'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ Error al crear log: {str(e)}")
            return Response({
                'error': f'Error al registrar el hábito: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # PROCESAR GAMIFICACIÓN después de registrar el hábito
        try:
            print(f"🎮 Procesando gamificación para usuario {request.user.id}")
            gamification_result = GamificationService.process_daily_gamification(
                user=request.user,
                target_date=date
            )
            
            print(f"🎮 Resultado gamificación: {gamification_result}")
            
            # Preparar respuesta con datos de gamificación
            response_data = {
                'message': 'Hábito registrado con éxito',
                'habit_data': HabitLogSerializer(log).data,
                'gamification': {
                    'points_earned_today': self._safe_get_points(gamification_result, 'daily_points'),
                    'total_cycle_points': self._safe_get_cycle_points(gamification_result, 'user_level'),
                    'current_level': self._safe_get_level(gamification_result, 'user_level'),
                    'current_streak': self._safe_get_streak(gamification_result, 'user_level'),
                    'new_medals': len(gamification_result.get('new_medals', [])),
                    'level_up': gamification_result.get('level_up', False)
                }
            }
            
            # Añadir detalles de medallas nuevas si las hay
            if gamification_result.get('new_medals'):
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
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error en gamificación para usuario {request.user.id}: {str(e)}")
            
            return Response({
                'message': 'Hábito registrado con éxito',
                'habit_data': HabitLogSerializer(log).data,
                'gamification_error': 'Error calculando puntos, pero el hábito se guardó correctamente'
            }, status=status.HTTP_201_CREATED)
    
    def _update_habit_streak(self, tracker, date, completion_level):
        """
        Actualiza la racha de cumplimiento de un hábito.
        """
        try:
            # Obtener o crear el streak
            streak, created = HabitStreak.objects.get_or_create(
                tracker=tracker,
                defaults={
                    'current_streak': 0,
                    'longest_streak': 0,
                    'last_log_date': None
                }
            )
            
            # Si el hábito se completó (nivel >= 2)
            if completion_level >= 2:
                # Verificar si es consecutivo
                if (streak.last_log_date and 
                    (date - streak.last_log_date).days == 1):
                    # Continuar racha
                    streak.current_streak += 1
                elif streak.last_log_date is None or (date - streak.last_log_date).days > 1:
                    # Iniciar nueva racha
                    streak.current_streak = 1
                
                # Actualizar racha más larga si es necesario
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
                    
            else:
                # Romper racha si no se completó adecuadamente
                streak.current_streak = 0
            
            # Actualizar fecha del último registro
            streak.last_log_date = date
            streak.save()
            
        except Exception as e:
            print(f"❌ Error al actualizar streak: {str(e)}")
    
    def _safe_get_points(self, gamification_result, key):
        """Obtener puntos de forma segura"""
        try:
            daily_points = gamification_result.get(key)
            if daily_points and hasattr(daily_points, 'total_points'):
                return daily_points.total_points
            elif isinstance(daily_points, dict):
                return daily_points.get('total_points', 0)
            return 0
        except:
            return 0
    
    def _safe_get_cycle_points(self, gamification_result, key):
        """Obtener puntos del ciclo de forma segura"""
        try:
            user_level = gamification_result.get(key)
            if user_level and hasattr(user_level, 'current_cycle_points'):
                return user_level.current_cycle_points
            elif isinstance(user_level, dict):
                return user_level.get('current_cycle_points', 0)
            return 0
        except:
            return 0
    
    def _safe_get_level(self, gamification_result, key):
        """Obtener nivel de forma segura"""
        try:
            user_level = gamification_result.get(key)
            if user_level and hasattr(user_level, 'current_level'):
                return user_level.current_level
            elif isinstance(user_level, dict):
                return user_level.get('current_level', 'NOVATO')
            return 'NOVATO'
        except:
            return 'NOVATO'
    
    def _safe_get_streak(self, gamification_result, key):
        """Obtener streak de forma segura"""
        try:
            user_level = gamification_result.get(key)
            if user_level and hasattr(user_level, 'current_streak'):
                return user_level.current_streak
            elif isinstance(user_level, dict):
                return user_level.get('current_streak', 0)
            return 0
        except:
            return 0

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