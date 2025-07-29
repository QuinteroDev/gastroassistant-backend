# gamification/tests/test_integration.py
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.services import CycleService
from gamification.services import GamificationService
from gamification.models import UserLevel, Medal, UserMedal, DailyPoints
from habits.models import HabitTracker, HabitLog
from questionnaires.models import HabitQuestion


@pytest.mark.django_db
@pytest.mark.integration
class TestGamificationIntegration:
    """Tests de integración entre ciclos y gamificación"""
    
    @pytest.fixture
    def complete_setup(self):
        """Setup completo con usuario, ciclo, hábitos y medallas"""
        user = User.objects.create_user(username='testuser')
        
        # Crear hábitos
        habits = []
        for habit_type in ['MEAL_SIZE', 'DINNER_TIME', 'LIE_DOWN', 'SMOKING', 'ALCOHOL']:
            habit = HabitQuestion.objects.create(
                habit_type=habit_type,
                text=f'Pregunta {habit_type}'
            )
            habits.append(habit)
        
        # Crear medallas
        medals = []
        for i in range(3):
            medal = Medal.objects.create(
                name=f'Medalla Ciclo {i+1}',
                description=f'Medalla para el ciclo {i+1}',
                required_points=500 * (i+1),
                required_level='NOVATO' if i == 0 else 'BRONCE',
                required_cycle_number=i+1
            )
            medals.append(medal)
        
        # Medalla de racha
        streak_medal = Medal.objects.create(
            name='Racha de 3 días',
            description='3 días consecutivos',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1
        )
        medals.append(streak_medal)
        
        return user, habits, medals
    
    def test_new_cycle_resets_gamification(self, complete_setup):
        """Test que un nuevo ciclo resetea correctamente la gamificación"""
        user, habits, medals = complete_setup
        
        # Crear primer ciclo
        cycle1 = CycleService.create_new_cycle(user)
        
        # Configurar trackers
        for habit in habits:
            HabitTracker.objects.create(
                user=user,
                habit=habit
            )
        
        # Ganar puntos en el primer ciclo
        level = GamificationService.get_or_create_user_level(user)
        level.current_cycle = cycle1
        level.current_cycle_points = 1500
        level.current_level = 'BRONCE'
        level.save()
        
        # Completar el ciclo
        cycle1.status = 'PENDING_RENEWAL'
        cycle1.save()
        
        # Crear segundo ciclo
        cycle2 = CycleService.create_new_cycle(user)
        
        # Verificar reset
        level.refresh_from_db()
        assert level.current_cycle == cycle2
        assert level.current_cycle_points == 0  # Reseteado
        assert level.current_level == 'BRONCE'  # Se mantiene
    
    def test_daily_activity_awards_medals(self, complete_setup):
        """Test que la actividad diaria otorga medallas correctamente"""
        user, habits, medals = complete_setup
        
        # Crear ciclo
        cycle = CycleService.create_new_cycle(user)
        
        # Configurar trackers
        trackers = []
        for i, habit in enumerate(habits):
            tracker = HabitTracker.objects.create(
                user=user,
                habit=habit,
                is_promoted=(i == 0)
            )
            trackers.append(tracker)
        
        # Simular 3 días de actividad perfecta
        for day in range(3):
            date = timezone.now().date() - timedelta(days=2-day)
            
            # Crear logs perfectos
            for tracker in trackers:
                HabitLog.objects.create(
                    tracker=tracker,
                    date=date,
                    completion_level=3
                )
            
            # Procesar gamificación
            result = GamificationService.process_daily_gamification(user, date)
            
            # En el tercer día debería ganar la medalla de racha
            if day == 2:
                assert len(result['new_medals']) > 0
                medal_names = [um.medal.name for um in result['new_medals']]
                assert any('3 días' in name for name in medal_names)
    
    def test_level_progression_across_cycles(self, complete_setup):
        """Test progresión de nivel a través de múltiples ciclos"""
        user, habits, medals = complete_setup
        
        # La progresión real según los logs:
        # Ciclo 1: NOVATO → BRONCE
        # Ciclo 2: BRONCE → PLATA
        # Ciclo 3: PLATA → ORO
        # Ciclo 4: ORO → PLATINO
        expected_progression = [
            ('NOVATO', 'BRONCE'),   # Ciclo 1
            ('BRONCE', 'PLATA'),    # Ciclo 2
            ('PLATA', 'ORO'),       # Ciclo 3
            ('ORO', 'PLATINO')      # Ciclo 4
        ]
        
        for cycle_num in range(4):
            # Crear ciclo
            cycle = CycleService.create_new_cycle(user)
            
            # Configurar trackers (usar get_or_create para evitar duplicados)
            for habit in habits:
                HabitTracker.objects.get_or_create(
                    user=user,
                    habit=habit,
                    defaults={'is_promoted': False}
                )
            
            # Simular puntos suficientes para subir de nivel
            level = GamificationService.get_or_create_user_level(user)
            
            # Guardar nivel inicial
            initial_level = level.current_level
            
            # Crear puntos diarios - USAR FECHA DIFERENTE PARA CADA CICLO
            points_date = timezone.now().date() - timedelta(days=cycle_num * 30)
            DailyPoints.objects.create(
                user=user,
                cycle=cycle,
                date=points_date,
                total_points=1700  # Suficiente para subir
            )
            
            # Actualizar progreso
            level, changed = GamificationService.update_user_level_progress(user)
            
            # Verificar progresión esperada
            expected_initial, expected_final = expected_progression[cycle_num]
            assert initial_level == expected_initial, f"Ciclo {cycle_num + 1}: nivel inicial debería ser {expected_initial}, pero es {initial_level}"
            assert level.current_level == expected_final, f"Ciclo {cycle_num + 1}: nivel final debería ser {expected_final}, pero es {level.current_level}"
            
            # Marcar ciclo como completado para el siguiente
            if cycle_num < 3:
                cycle.status = 'PENDING_RENEWAL'
                cycle.save()