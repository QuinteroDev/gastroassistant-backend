# cycles/tests/test_models.py
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.models import UserCycle, CycleSnapshot, CycleHabitAssignment
from questionnaires.models import HabitQuestion
from programs.models import TreatmentProgram


# Fixtures globales (fuera de las clases)
@pytest.fixture
def user():
    """Usuario de prueba"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com'
    )

@pytest.fixture
def user_with_cycle(user):
    """Usuario con un ciclo activo"""
    cycle = UserCycle.objects.create(
        user=user,
        cycle_number=1,
        start_date=timezone.now(),
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE'
    )
    return user, cycle

@pytest.fixture
def habit_question():
    """Pregunta de hábito de prueba"""
    return HabitQuestion.objects.create(
        habit_type='MEAL_SIZE',
        text='¿Cuánta comida ingieres?'
    )

@pytest.mark.django_db
class TestUserCycleModel:
    """Tests para el modelo UserCycle"""
    
    def test_cycle_creation(self, user_with_cycle):
        """Test creación básica de ciclo"""
        user, cycle = user_with_cycle
        
        assert cycle.user == user
        assert cycle.cycle_number == 1
        assert cycle.status == 'ACTIVE'
        assert cycle.phenotype == 'UNDETERMINED'
        assert cycle.gerdq_score is None
        assert cycle.rsi_score is None
        assert cycle.program is None
        assert cycle.onboarding_completed_at is None
    
    def test_days_elapsed_calculation(self, user):
        """Test cálculo de días transcurridos"""
        # Crear ciclo que empezó hace 5 días
        start_date = timezone.now() - timedelta(days=4)
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=start_date,
            end_date=start_date + timedelta(days=30),
            status='ACTIVE'
        )
        
        # El primer día cuenta como día 1, por eso son 5 días
        assert cycle.days_elapsed == 5
    
    def test_days_elapsed_first_day(self, user_with_cycle):
        """Test que el primer día cuenta como día 1"""
        user, cycle = user_with_cycle
        assert cycle.days_elapsed == 1
    
    def test_days_remaining_calculation(self, user):
        """Test cálculo de días restantes"""
        # Ciclo que termina en 10 días
        start_date = timezone.now()
        end_date = start_date + timedelta(days=10)
        
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=start_date,
            end_date=end_date,
            status='ACTIVE'
        )
        
        # Debería tener 9 o 10 días restantes dependiendo de la hora
        assert 9 <= cycle.days_remaining <= 10
    
    def test_days_remaining_expired(self, user):
        """Test días restantes cuando el ciclo ya expiró"""
        # Ciclo que terminó ayer
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now() - timedelta(days=31),
            end_date=timezone.now() - timedelta(days=1),
            status='ACTIVE'
        )
        
        assert cycle.days_remaining == 0
    
    def test_check_and_update_status_active(self, user):
        """Test que ciclo activo no cambia si no ha expirado"""
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=15),
            status='ACTIVE'
        )
        
        status = cycle.check_and_update_status()
        assert status == 'ACTIVE'
        
        cycle.refresh_from_db()
        assert cycle.status == 'ACTIVE'
    
    def test_check_and_update_status_expired(self, user):
        """Test actualización automática de estado cuando expira"""
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now() - timedelta(days=31),
            end_date=timezone.now() - timedelta(days=1),
            status='ACTIVE'
        )
        
        status = cycle.check_and_update_status()
        assert status == 'PENDING_RENEWAL'
        
        cycle.refresh_from_db()
        assert cycle.status == 'PENDING_RENEWAL'
    
    def test_unique_constraint(self, user):
        """Test que no puede haber dos ciclos con el mismo número para un usuario"""
        # Crear primer ciclo
        UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        # Intentar crear otro ciclo con el mismo número
        with pytest.raises(Exception):  # IntegrityError
            UserCycle.objects.create(
                user=user,
                cycle_number=1,
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=30)
            )
    
    def test_str_representation(self, user_with_cycle):
        """Test representación string del modelo"""
        user, cycle = user_with_cycle
        expected = f"testuser - Ciclo 1 (ACTIVE)"
        assert str(cycle) == expected
    
    def test_ordering(self, user):
        """Test que los ciclos se ordenan por número descendente"""
        # Crear 3 ciclos
        for i in range(1, 4):
            UserCycle.objects.create(
                user=user,
                cycle_number=i,
                start_date=timezone.now() - timedelta(days=30*(4-i)),
                end_date=timezone.now() - timedelta(days=30*(3-i)),
                status='COMPLETED'
            )
        
        cycles = UserCycle.objects.filter(user=user)
        cycle_numbers = [c.cycle_number for c in cycles]
        
        # Deberían estar en orden descendente
        assert cycle_numbers == [3, 2, 1]


@pytest.mark.django_db
class TestCycleHabitAssignment:
    """Tests para el modelo CycleHabitAssignment"""
    
    def test_habit_assignment_creation(self, user_with_cycle, habit_question):
        """Test creación de asignación de hábito"""
        user, cycle = user_with_cycle
        
        assignment = CycleHabitAssignment.objects.create(
            cycle=cycle,
            habit=habit_question,
            initial_score=1,
            priority_order=1
        )
        
        assert assignment.cycle == cycle
        assert assignment.habit == habit_question
        assert assignment.initial_score == 1
        assert assignment.priority_order == 1
    
    def test_habit_assignment_ordering(self, user_with_cycle):
        """Test que las asignaciones se ordenan por prioridad"""
        user, cycle = user_with_cycle
        
        # Crear 3 hábitos con diferentes prioridades
        for i in [3, 1, 2]:
            habit = HabitQuestion.objects.create(
                habit_type=f'HABIT_{i}',
                text=f'Hábito {i}'
            )
            CycleHabitAssignment.objects.create(
                cycle=cycle,
                habit=habit,
                initial_score=0,
                priority_order=i
            )
        
        assignments = CycleHabitAssignment.objects.filter(cycle=cycle)
        priorities = [a.priority_order for a in assignments]
        
        # Deberían estar ordenados por prioridad
        assert priorities == [1, 2, 3]


@pytest.mark.django_db
class TestCycleSnapshot:
    """Tests para el modelo CycleSnapshot"""
    
    def test_snapshot_creation(self, user_with_cycle):
        """Test creación de snapshot"""
        user, cycle = user_with_cycle
        
        snapshot = CycleSnapshot.objects.create(
            cycle=cycle,
            weight_kg=80.5,
            height_cm=175,
            bmi=26.2,
            has_hernia='YES',
            has_altered_motility='NO',
            stress_affects='SOMETIMES',
            endoscopy_result='NORMAL',
            ph_monitoring_result='NOT_DONE',
            habit_scores={
                'MEAL_SIZE': 2,
                'DINNER_TIME': 1,
                'SMOKING': 3,
                'ALCOHOL': 2,
                'EXERCISE': 1
            }
        )
        
        assert snapshot.cycle == cycle
        assert snapshot.weight_kg == 80.5
        assert snapshot.bmi == 26.2
        assert snapshot.has_hernia == 'YES'
        assert isinstance(snapshot.habit_scores, dict)
        assert snapshot.habit_scores['MEAL_SIZE'] == 2
    
    def test_snapshot_one_to_one_relationship(self, user_with_cycle):
        """Test que solo puede haber un snapshot por ciclo"""
        user, cycle = user_with_cycle
        
        # Crear primer snapshot
        CycleSnapshot.objects.create(
            cycle=cycle,
            habit_scores={}
        )
        
        # Intentar crear otro snapshot para el mismo ciclo
        with pytest.raises(Exception):  # IntegrityError
            CycleSnapshot.objects.create(
                cycle=cycle,
                habit_scores={}
            )