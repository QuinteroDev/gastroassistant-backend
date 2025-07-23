# cycles/tests/test_services.py
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
    
    def test_create_cycle_snapshot(self, user_with_habits):
        """Test crear snapshot del ciclo"""
        user, _ = user_with_habits
        
        # Configurar perfil
        profile = user.profile
        profile.weight_kg = 80
        profile.height_cm = 175
        profile.has_hernia = 'YES'
        profile.save()
        
        cycle = CycleService.create_new_cycle(user)
        
        # Crear snapshot
        snapshot = CycleService._create_cycle_snapshot(cycle)
        
        assert snapshot is not None
        assert snapshot.weight_kg == 80
        assert snapshot.height_cm == 175
        assert snapshot.has_hernia == 'YES'
        assert isinstance(snapshot.habit_scores, dict)
    
    def test_assign_worst_habits(self, user_with_habits):
        """Test asignar los 5 peores hábitos"""
        user, habits = user_with_habits
        cycle = CycleService.create_new_cycle(user)
        
        # Asignar hábitos
        CycleService._assign_worst_habits(cycle)
        
        # Verificar que se asignaron 5 hábitos
        assignments = CycleHabitAssignment.objects.filter(cycle=cycle)
        assert assignments.count() == 5
        
        # Verificar que están ordenados por score inicial (peores primero)
        scores = [a.initial_score for a in assignments.order_by('priority_order')]
        assert scores == sorted(scores)  # Debería estar en orden ascendente
    
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