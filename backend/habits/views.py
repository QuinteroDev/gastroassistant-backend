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
from .models import HabitTracker, HabitLog
from .serializers import HabitTrackerSerializer, HabitLogSerializer
from recommendations.services import HabitTrackingService

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
        trackers = HabitTrackingService.setup_habit_tracking(request.user)
        
        return Response({
            'message': 'Respuestas guardadas con éxito.',
            'answers_count': len(saved_answers),
            'trackers_created': len(trackers)
        }, status=status.HTTP_201_CREATED)

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
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Espera un JSON como:
        {
            "habit_id": 1,
            "date": "2023-06-15", (opcional, default=hoy)
            "completion_level": 2,
            "notes": "..." (opcional)
        }
        """
        habit_id = request.data.get('habit_id')
        date_str = request.data.get('date')
        completion_level = request.data.get('completion_level')
        notes = request.data.get('notes', '')
        
        # Validaciones básicas
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
        
        # Registrar el hábito
        log = HabitTrackingService.log_habit(
            user=request.user,
            habit_id=habit_id,
            date=date,
            completion_level=completion_level,
            notes=notes
        )
        
        if log:
            return Response({
                'message': 'Hábito registrado con éxito',
                'data': HabitLogSerializer(log).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'No se pudo registrar el hábito'
            }, status=status.HTTP_400_BAD_REQUEST)

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