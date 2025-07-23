# cycles/tests/test_models_fixed.py - Renombra test_models.py a esto
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.models import UserCycle, CycleSnapshot, CycleHabitAssignment
from questionnaires.models import HabitQuestion
from programs.models import TreatmentProgram


@pytest.mark.django_db
class TestUserCycleModel:
    """Tests para el modelo UserCycle"""
    
    @pytest.fixture
    def user_with_cycle(self):
        """Usuario con un ciclo activo"""
        user = User.objects.create_user(username='testuser')
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        return user, cycle
    
    def test_cycle_creation(self, user_with_cycle):
        """Test creación básica de ciclo"""
        user, cycle = user_with_cycle
        
        assert cycle.user == user
        assert cycle.cycle_number == 1
        assert cycle.status == 'ACTIVE'
        assert cycle.phenotype == 'UNDETERMINED'
        assert cycle.days_remaining >= 29  # Aproximadamente 30 días
    
    def test_days_elapsed_calculation(self, user_with_cycle):
        """Test cálculo de días transcurridos"""
        user, cycle = user_with_cycle
        
        # Día 1 (primer día)
        assert cycle.days_elapsed == 1
        
        # Simular que pasaron 5 días
        cycle.start_date = timezone.now() - timedelta(days=4)
        cycle.save()
        
        assert cycle.days_elapsed == 5
    
    def test_days_remaining_calculation(self, user_with_cycle):
        """Test cálculo de días restantes"""
        user, cycle = user_with_cycle
        
        # Debería tener aproximadamente 30 días
        assert 28 <= cycle.days_remaining <= 30
        
        # Simular que el ciclo termina mañana
        cycle.end_date = timezone.now() + timedelta(days=1)
        cycle.save()
        
        assert cycle.days_remaining in [0, 1]
    
    def test_check_and_update_status(self, user_with_cycle):
        """Test actualización automática de estado"""
        user, cycle = user_with_cycle
        
        # Ciclo activo no debería cambiar
        status = cycle.check_and_update_status()
        assert status == 'ACTIVE'
        assert cycle.status == 'ACTIVE'  # CAMBIADO: verificar el atributo directamente
        
        # Simular que el ciclo expiró
        cycle.end_date = timezone.now() - timedelta(days=1)
        cycle.save()
        
        status = cycle.check_and_update_status()
        assert status == 'PENDING_RENEWAL'
        
        # Verificar que se guardó
        cycle.refresh_from_db()
        assert cycle.status == 'PENDING_RENEWAL'
    
    def test_unique_constraint(self):
        """Test que no puede haber dos ciclos con el mismo número para un usuario"""
        user = User.objects.create_user(username='testuser2')
        
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


# cycles/tests/test_services_fixed.py - Arreglar el DISTINCT ON
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.services import CycleService
from cycles.models import UserCycle, CycleSnapshot, CycleHabitAssignment
from questionnaires.models import HabitQuestion, HabitOption, UserHabitAnswer
from profiles.models import UserProfile
from programs.models import TreatmentProgram


@pytest.mark.django_db
class TestCycleService:
    """Tests para el servicio de ciclos"""
    
    @pytest.fixture
    def user_with_habits(self):
        """Usuario con respuestas de hábitos"""
        user = User.objects.create_user(username='testuser')
        
        # Crear 5 hábitos con opciones
        habits = []
        for i, habit_type in enumerate(['MEAL_SIZE', 'DINNER_TIME', 'LIE_DOWN', 'SMOKING', 'ALCOHOL']):
            habit = HabitQuestion.objects.create(
                habit_type=habit_type,
                text=f'Pregunta {habit_type}'
            )
            
            # Crear 4 opciones (0-3 puntos)
            for value in range(4):
                option = HabitOption.objects.create(
                    question=habit,
                    text=f'Opción {value}',
                    value=value,
                    order=value
                )
                
                # Crear respuesta del usuario (peores hábitos primero)
                if value == i % 4:  # Diferentes scores para cada hábito
                    UserHabitAnswer.objects.create(
                        user=user,
                        question=habit,
                        selected_option=option,
                        is_onboarding=True
                    )
            
            habits.append(habit)
        
        return user, habits
    
    def test_create_new_cycle_first_time(self, user_with_habits):
        """Test crear primer ciclo"""
        user, _ = user_with_habits
        
        cycle = CycleService.create_new_cycle(user, is_first_cycle=True)
        
        assert cycle is not None
        assert cycle.cycle_number == 1
        assert cycle.status == 'ACTIVE'
        assert cycle.user == user
    
    def test_create_new_cycle_subsequent(self, user_with_habits):
        """Test crear ciclo subsecuente"""
        user, _ = user_with_habits
        
        # Crear primer ciclo
        first_cycle = CycleService.create_new_cycle(user)
        first_cycle.status = 'PENDING_RENEWAL'
        first_cycle.save()
        
        # Crear segundo ciclo
        second_cycle = CycleService.create_new_cycle(user)
        
        assert second_cycle.cycle_number == 2
        
        # Verificar que el primer ciclo se marcó como completado
        first_cycle.refresh_from_db()
        assert first_cycle.status == 'COMPLETED'
    
    def test_complete_cycle_onboarding(self, user_with_habits):
        """Test completar onboarding del ciclo"""
        user, habits = user_with_habits
        
        # Crear ciclo y programa
        cycle = CycleService.create_new_cycle(user)
        program = TreatmentProgram.objects.create(
            name='Programa Test',
            type='A',
            description='Test'
        )
        
        # Completar onboarding
        completed_cycle = CycleService.complete_cycle_onboarding(
            cycle=cycle,
            gerdq_score=10,
            rsi_score=15,
            phenotype='EROSIVE',
            program=program
        )
        
        assert completed_cycle.gerdq_score == 10
        assert completed_cycle.rsi_score == 15
        assert completed_cycle.phenotype == 'EROSIVE'
        assert completed_cycle.program == program
        assert completed_cycle.onboarding_completed_at is not None
    
    # REEMPLAZAR el método _create_cycle_snapshot en CycleService
    # En cycles/services.py, cambiar la parte problemática:
    """
    # CAMBIAR ESTO:
    habit_answers = UserHabitAnswer.objects.filter(
        user=cycle.user,
        answered_at__lte=cycle.start_date + timedelta(days=1)
    ).select_related('question', 'selected_option').order_by(
        'question__id', '-answered_at'
    ).distinct('question')
    
    # POR ESTO (compatible con SQLite):
    # Obtener la respuesta más reciente para cada hábito
    habit_answers = []
    all_answers = UserHabitAnswer.objects.filter(
        user=cycle.user,
        answered_at__lte=cycle.start_date + timedelta(days=1)
    ).select_related('question', 'selected_option').order_by('question__id', '-answered_at')
    
    seen_questions = set()
    for answer in all_answers:
        if answer.question_id not in seen_questions:
            habit_answers.append(answer)
            seen_questions.add(answer.question_id)
    """
    
    def test_get_current_cycle(self, user_with_habits):
        """Test obtener ciclo actual"""
        user, _ = user_with_habits
        
        # Sin ciclos
        current = CycleService.get_current_cycle(user)
        assert current is None
        
        # Con ciclo activo
        cycle = CycleService.create_new_cycle(user)
        current = CycleService.get_current_cycle(user)
        assert current == cycle
        
        # Con ciclo pendiente de renovación
        cycle.status = 'PENDING_RENEWAL'
        cycle.save()
        current = CycleService.get_current_cycle(user)
        assert current == cycle
    
    def test_needs_new_cycle(self, user_with_habits):
        """Test verificar si necesita nuevo ciclo"""
        user, _ = user_with_habits
        
        # Sin ciclos, necesita uno
        assert CycleService.needs_new_cycle(user) is True
        
        # Con ciclo activo sin onboarding
        cycle = CycleService.create_new_cycle(user)
        assert CycleService.needs_new_cycle(user) is False
        
        # Con ciclo activo con onboarding completado
        cycle.onboarding_completed_at = timezone.now()
        cycle.save()
        assert CycleService.needs_new_cycle(user) is False
        
        # Con ciclo pendiente de renovación
        cycle.status = 'PENDING_RENEWAL'
        cycle.save()
        assert CycleService.needs_new_cycle(user) is True