# gamification/tests/test_services.py
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from gamification.services import GamificationService
from gamification.models import UserLevel, Medal, UserMedal, DailyPoints
from cycles.models import UserCycle
from habits.models import HabitTracker, HabitLog
from questionnaires.models import HabitQuestion


@pytest.mark.django_db
class TestGamificationService:
    """Tests para el servicio de gamificación"""
    
    @pytest.fixture
    def user_with_habits_and_cycle(self):
        """Usuario con ciclo activo y hábitos configurados"""
        user = User.objects.create_user(username='testuser')
        
        # Crear ciclo
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        # Crear 5 hábitos
        habits = []
        trackers = []
        for i in range(5):
            habit = HabitQuestion.objects.create(
                habit_type=f'HABIT_{i}',
                text=f'Hábito {i}'
            )
            tracker = HabitTracker.objects.create(
                user=user,
                habit=habit,
                cycle=cycle,
                is_promoted=(i == 0)  # Primer hábito promocionado
            )
            habits.append(habit)
            trackers.append(tracker)
        
        return user, cycle, habits, trackers
    
    def test_get_or_create_user_level(self, user_with_habits_and_cycle):
        """Test obtener o crear nivel de usuario"""
        user, cycle, _, _ = user_with_habits_and_cycle
        
        # Primera vez, debe crear
        level = GamificationService.get_or_create_user_level(user)
        assert level is not None
        assert level.current_level == 'NOVATO'
        
        # Segunda vez, debe obtener el mismo
        level2 = GamificationService.get_or_create_user_level(user)
        assert level2.id == level.id
    
    def test_calculate_daily_points_no_logs(self, user_with_habits_and_cycle):
        """Test calcular puntos sin logs de hábitos"""
        user, _, _, _ = user_with_habits_and_cycle
        
        result = GamificationService.calculate_daily_points(user)
        
        assert result['total_points'] == 0
        assert result['habit_points'] == 0
        assert result['habits_completed'] == 0
    
    def test_calculate_daily_points_with_logs(self, user_with_habits_and_cycle):
        """Test calcular puntos con logs de hábitos"""
        user, cycle, habits, trackers = user_with_habits_and_cycle
        today = timezone.now().date()
        
        # Crear logs para todos los hábitos
        for i, tracker in enumerate(trackers):
            HabitLog.objects.create(
                tracker=tracker,
                date=today,
                completion_level=3 if i < 3 else 2  # 3 perfectos, 2 buenos
            )
        
        result = GamificationService.calculate_daily_points(user, today)
        
        # Verificar cálculos
        assert result['habits_completed'] == 5  # Todos nivel 2 o 3
        assert result['habits_total'] == 5
        assert result['bonus_completion'] == 25  # Bonus por completar todos
        
        # Hábito promocionado (primer hábito con nivel 3)
        assert result['bonus_promoted'] > 0
        
        # Total debería incluir puntos base + bonus
        assert result['total_points'] > 0
    
    def test_calculate_streak(self, user_with_habits_and_cycle):
        """Test calcular racha de días consecutivos"""
        user, cycle, habits, trackers = user_with_habits_and_cycle
        
        # Crear logs para 3 días consecutivos
        for days_ago in range(3):
            log_date = timezone.now().date() - timedelta(days=days_ago)
            for tracker in trackers:
                HabitLog.objects.create(
                    tracker=tracker,
                    date=log_date,
                    completion_level=3  # Todos perfectos
                )
        
        # Calcular racha
        streak = GamificationService.calculate_streak_on_date(user, timezone.now().date())
        assert streak == 3
        
        # Romper la racha (no crear logs para ayer)
        future_date = timezone.now().date() + timedelta(days=2)
        streak_broken = GamificationService.calculate_streak_on_date(user, future_date)
        assert streak_broken == 0
    
    def test_update_daily_points(self, user_with_habits_and_cycle):
        """Test actualizar registro de puntos diarios"""
        user, cycle, habits, trackers = user_with_habits_and_cycle
        
        # Asignar ciclo al nivel del usuario
        level = GamificationService.get_or_create_user_level(user)
        level.current_cycle = cycle
        level.save()
        
        # Crear logs
        today = timezone.now().date()
        for tracker in trackers:
            HabitLog.objects.create(
                tracker=tracker,
                date=today,
                completion_level=3
            )
        
        # Actualizar puntos
        daily_points = GamificationService.update_daily_points(user, today)
        
        assert daily_points is not None
        assert daily_points.date == today
        assert daily_points.habits_completed == 5
        assert daily_points.total_points > 0
    
    def test_update_user_level_progress(self, user_with_habits_and_cycle):
        """Test actualizar progreso y nivel del usuario"""
        user, cycle, _, _ = user_with_habits_and_cycle
        
        # Crear nivel con ciclo
        level = UserLevel.objects.create(
            user=user,
            current_cycle=cycle,
            current_level='NOVATO'
        )
        
        # Crear puntos suficientes para subir de nivel
        DailyPoints.objects.create(
            user=user,
            cycle=cycle,
            date=timezone.now().date(),
            total_points=1700  # Más de 1600 necesarios
        )
        
        # Actualizar progreso
        updated_level, level_changed = GamificationService.update_user_level_progress(user)
        
        assert updated_level.current_cycle_points == 1700
        assert updated_level.current_level == 'BRONCE'
        assert level_changed is True
    
    def test_check_new_medals(self, user_with_habits_and_cycle):
        """Test verificar nuevas medallas desbloqueadas"""
        user, cycle, _, _ = user_with_habits_and_cycle
        
        # Crear nivel
        level = UserLevel.objects.create(
            user=user,
            current_cycle=cycle,
            current_level='BRONCE',
            current_cycle_points=500
        )
        
        # Crear medallas disponibles
        medal1 = Medal.objects.create(
            name='Medalla 100',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1
        )
        medal2 = Medal.objects.create(
            name='Medalla 1000',
            required_points=1000,
            required_level='BRONCE',
            required_cycle_number=1
        )
        
        # Verificar medallas
        new_medals = GamificationService.check_new_medals(user)
        
        # Debería obtener solo la primera (tiene 500 puntos, menos de 1000)
        assert len(new_medals) == 1
        assert new_medals[0].medal == medal1
    
    def test_process_daily_gamification(self, user_with_habits_and_cycle):
        """Test proceso completo de gamificación diaria"""
        user, cycle, habits, trackers = user_with_habits_and_cycle
        
        # Configurar nivel
        level = UserLevel.objects.create(
            user=user,
            current_cycle=cycle,
            current_level='NOVATO'
        )
        
        # Crear logs para hoy
        today = timezone.now().date()
        for tracker in trackers:
            HabitLog.objects.create(
                tracker=tracker,
                date=today,
                completion_level=3
            )
        
        # Procesar gamificación
        result = GamificationService.process_daily_gamification(user, today)
        
        assert result['daily_points'] is not None
        assert result['user_level'] is not None
        assert result['points_earned'] > 0
        assert 'new_medals' in result
    
    def test_reset_for_new_cycle(self, user_with_habits_and_cycle):
        """Test resetear gamificación para nuevo ciclo"""
        user, old_cycle, _, _ = user_with_habits_and_cycle
        
        # Crear nivel con puntos
        level = UserLevel.objects.create(
            user=user,
            current_cycle=old_cycle,
            current_level='BRONCE',
            current_cycle_points=1500,
            current_streak=10
        )
        
        # Crear nuevo ciclo
        new_cycle = UserCycle.objects.create(
            user=user,
            cycle_number=2,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        # Resetear
        updated_level = GamificationService.reset_for_new_cycle(user, new_cycle)
        
        assert updated_level.current_cycle == new_cycle
        assert updated_level.current_cycle_points == 0  # Reseteado
        assert updated_level.current_level == 'BRONCE'  # Se mantiene
        assert updated_level.current_streak == 10  # Se mantiene si hay actividad reciente