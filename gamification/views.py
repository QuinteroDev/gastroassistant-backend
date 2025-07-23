# gamification/views.py - VERSIÓN MEJORADA
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from .models import UserLevel, UserMedal, Medal
from .services import GamificationService
from .serializers import UserLevelSerializer, UserMedalSerializer, MedalSerializer


class GamificationDashboardView(APIView):
    """
    Dashboard completo de gamificación - TODO EN UNO
    Lo único que necesita el frontend para mostrar el progreso del usuario
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_level = GamificationService.get_or_create_user_level(request.user)
        
        # Calcular progreso hacia siguiente nivel
        progress_data = {
            'current_points': user_level.current_cycle_points,
            'next_level_points': None,
            'progress_percentage': 0
        }
        
        if user_level.current_cycle:
            cycle_num = user_level.current_cycle.cycle_number
            threshold_data = GamificationService.LEVEL_THRESHOLDS.get(cycle_num)
            
            if threshold_data:
                progress_data['next_level_points'] = threshold_data['points']
                progress_data['progress_percentage'] = min(
                    100, 
                    (user_level.current_cycle_points / threshold_data['points']) * 100
                )
        
        # Medallas ganadas en este ciclo
        cycle_medals = []
        if user_level.current_cycle:
            cycle_medals = UserMedal.objects.filter(
                user=request.user,
                cycle_earned=user_level.current_cycle
            ).select_related('medal')
        
        return Response({
            'level': user_level.current_level,
            'current_points': user_level.current_cycle_points,
            'current_streak': user_level.current_streak,
            'longest_streak': user_level.longest_streak,
            'progress': progress_data,
            'cycle_number': user_level.current_cycle.cycle_number if user_level.current_cycle else None,
            'medals_this_cycle': UserMedalSerializer(cycle_medals, many=True).data
        })

class ProcessGamificationView(APIView):
    """
    Procesa la gamificación cuando se actualizan hábitos
    ARREGLADO: Serializa correctamente las medallas
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        target_date = request.data.get('date')
        
        if target_date:
            try:
                target_date = timezone.datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Usar YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.now().date()
        
        try:
            # Procesar gamificación
            result = GamificationService.process_daily_gamification(
                request.user, 
                target_date
            )
            
            # Crear respuesta base
            response_data = {
                'processed': True,
                'date': target_date.isoformat(),
                'level_up': len(result.get('new_medals', [])) > 0,
                'level_changed': result.get('level_changed', False),
                'new_medals_count': len(result.get('new_medals', [])),
                'points_earned': result.get('points_earned', 0)
            }
            
            # ARREGLO: Serializar medallas manualmente si el serializer no funciona
            if result.get('new_medals'):
                try:
                    # Intentar con el serializer primero
                    serialized_medals = UserMedalSerializer(result['new_medals'], many=True).data
                    
                    # Si el serializer devuelve lista vacía, serializar manualmente
                    if not serialized_medals:
                        serialized_medals = []
                        for user_medal in result['new_medals']:
                            medal_data = {
                                'id': user_medal.id,
                                'medal': {
                                    'id': user_medal.medal.id,
                                    'name': user_medal.medal.name,
                                    'description': user_medal.medal.description,
                                    'icon': user_medal.medal.icon,
                                    'required_points': user_medal.medal.required_points,
                                    'required_level': user_medal.medal.required_level,
                                    'required_cycle_number': user_medal.medal.required_cycle_number,
                                },
                                'earned_at': user_medal.earned_at.isoformat() if user_medal.earned_at else None,
                                'points_when_earned': user_medal.points_when_earned,
                                'level_when_earned': user_medal.level_when_earned,
                                'cycle_number': user_medal.cycle_earned.cycle_number if user_medal.cycle_earned else None
                            }
                            serialized_medals.append(medal_data)
                    
                    response_data['new_medals'] = serialized_medals
                    
                    # Log para debugging
                    print(f"🏆 Medallas serializadas: {len(serialized_medals)}")
                    if serialized_medals:
                        print(f"   Primera medalla: {serialized_medals[0].get('medal', {}).get('name', 'Sin nombre')}")
                        
                except Exception as e:
                    print(f"❌ Error serializando medallas: {str(e)}")
                    # Fallback: serialización manual básica
                    response_data['new_medals'] = [{
                        'id': m.id,
                        'medal': {
                            'name': m.medal.name,
                            'description': m.medal.description,
                            'icon': m.medal.icon
                        }
                    } for m in result.get('new_medals', [])]
            else:
                response_data['new_medals'] = []
            
            # Incluir información de nivel si cambió
            if result.get('level_changed'):
                response_data['new_level'] = result['user_level'].current_level
            
            # Incluir información de progreso
            if result.get('user_level'):
                response_data['current_level'] = result['user_level'].current_level
                response_data['current_points'] = result['user_level'].current_cycle_points
                response_data['current_streak'] = result['user_level'].current_streak
            
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ Error en ProcessGamificationView: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response({
                'error': 'Error interno al procesar gamificación',
                'processed': False,
                'details': str(e) if request.user.is_staff else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserMedalsView(APIView):
    """
    NUEVA: Vista para obtener todas las medallas del usuario
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Medallas ganadas por el usuario
        user_medals = UserMedal.objects.filter(
            user=request.user
        ).select_related('medal', 'cycle_earned').order_by('-earned_at')
        
        return Response({
            'medals': UserMedalSerializer(user_medals, many=True).data,
            'total_medals': user_medals.count()
        })

class TestGamificationView(APIView):
    """
    NUEVA: Vista para testing - solo en desarrollo
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Solo para staff'}, status=status.HTTP_403_FORBIDDEN)
        
        # Forzar verificación de medallas
        user_level = GamificationService.get_or_create_user_level(request.user)
        new_medals = GamificationService.check_new_medals(request.user)
        
        return Response({
            'test_completed': True,
            'user_level': user_level.current_level,
            'current_points': user_level.current_cycle_points,
            'new_medals_found': len(new_medals),
            'medals': UserMedalSerializer(new_medals, many=True).data if new_medals else []
        })
    

class AllMedalsView(APIView):
    """
    NUEVA: Vista para obtener todas las medallas disponibles
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Todas las medallas activas
        all_medals = Medal.objects.filter(is_active=True).order_by('required_cycle_number', 'order')
        
        # Medallas ganadas por el usuario
        earned_medal_ids = UserMedal.objects.filter(
            user=request.user
        ).values_list('medal_id', flat=True)
        
        # Añadir campo is_earned a cada medalla
        medals_data = []
        for medal in all_medals:
            medal_data = MedalSerializer(medal).data
            medal_data['is_earned'] = medal.id in earned_medal_ids
            medals_data.append(medal_data)
        
        return Response({
            'medals': medals_data,
            'total_medals': len(medals_data),
            'earned_count': len(earned_medal_ids)
        })