# cycles/tests/test_services.py
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
from cycles.services import CycleService
from cycles.models import UserCycle, CycleSnapshot, CycleHabitAssignment
from questionnaires.models import HabitQuestion, HabitOption, UserHabitAnswer
from profiles.models import UserProfile
from programs.models import TreatmentProgram
from gamification.models import UserLevel


@pytest.mark.django_db
class TestCycleService:
    """Tests para el servicio de ciclos"""
    
    @pytest.fixture
    def user(self):
        """Usuario de prueba"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        # Asegurar que existe el perfil
        UserProfile.objects.get_or_create(user=user)
        return user
    
    @pytest.fixture
    def user_with_habits(self, user):
        """Usuario con respuestas de hábitos"""
        habits_data = [
            ('MEAL_SIZE', 0),      # Peor hábito
            ('DINNER_TIME', 1),    # Segundo peor
            ('LIE_DOWN', 1),       # Tercero
            ('SMOKING', 2),        # Cuarto
            ('ALCOHOL', 2),        # Quinto
            ('EXERCISE', 3),       # Sexto (no se asignará)
            ('HYDRATION', 3),      # Séptimo (no se asignará)
        ]
        
        habits = []
        for habit_type, score in habits_data:
            habit = HabitQuestion.objects.create(
                habit_type=habit_type,
                text=f'Pregunta sobre {habit_type}'
            )
            
            # Crear 4 opciones (0-3 puntos)
            options = []
            for value in range(4):
                option = HabitOption.objects.create(
                    question=habit,
                    text=f'Opción {value}',
                    value=value,
                    order=value
                )
                options.append(option)
            
            # Crear respuesta del usuario
            UserHabitAnswer.objects.create(
                user=user,
                question=habit,
                selected_option=options[score],
                is_onboarding=True,
                answered_at=timezone.now()
            )
            
            habits.append(habit)
        
        return user, habits
    
    @pytest.fixture
    def program(self):
        """Programa de tratamiento de prueba"""
        return TreatmentProgram.objects.create(
            name='Programa Test',
            type='A',
            description='Programa de prueba'
        )
    
    def test_create_new_cycle_first_time(self, user):
        """Test crear primer ciclo"""
        cycle = CycleService.create_new_cycle(user, is_first_cycle=True)
        
        assert cycle is not None
        assert cycle.cycle_number == 1
        assert cycle.status == 'ACTIVE'
        assert cycle.user == user
        
        # Verificar fechas
        assert cycle.start_date is not None
        assert cycle.end_date is not None
        assert (cycle.end_date - cycle.start_date).days == 30
    
    def test_create_new_cycle_subsequent(self, user):
        """Test crear ciclo subsecuente"""
        # Crear primer ciclo
        first_cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now() - timedelta(days=31),
            end_date=timezone.now() - timedelta(days=1),
            status='PENDING_RENEWAL'
        )
        
        # Crear segundo ciclo
        second_cycle = CycleService.create_new_cycle(user)
        
        assert second_cycle.cycle_number == 2
        assert second_cycle.status == 'ACTIVE'
        
        # Verificar que el primer ciclo se marcó como completado
        first_cycle.refresh_from_db()
        assert first_cycle.status == 'COMPLETED'
    
    def test_complete_cycle_onboarding(self, user_with_habits, program):
        """Test completar onboarding del ciclo"""
        user, habits = user_with_habits
        
        # Crear ciclo
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
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
        
        # Verificar que se creó el snapshot
        assert hasattr(completed_cycle, 'snapshot')
        assert completed_cycle.snapshot is not None
        
        # Verificar que se asignaron 5 hábitos
        assignments = CycleHabitAssignment.objects.filter(cycle=completed_cycle)
        assert assignments.count() == 5
    
    def test_create_cycle_snapshot(self, user_with_habits):
        """Test crear snapshot del ciclo"""
        user, _ = user_with_habits
        
        # Configurar perfil
        profile = user.profile
        profile.weight_kg = 80
        profile.height_cm = 175
        profile.has_hernia = 'YES'
        profile.endoscopy_result = 'ESOPHAGITIS_A'
        profile.save()
        
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        # Crear snapshot
        snapshot = CycleService._create_cycle_snapshot(cycle)
        
        assert snapshot is not None
        assert snapshot.weight_kg == 80
        assert snapshot.height_cm == 175
        assert snapshot.has_hernia == 'YES'
        assert snapshot.endoscopy_result == 'ESOPHAGITIS_A'
        assert isinstance(snapshot.habit_scores, dict)
    
    def test_assign_worst_habits(self, user_with_habits):
        """Test asignar los 5 peores hábitos"""
        user, habits = user_with_habits
        
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        # Asignar hábitos
        CycleService._assign_worst_habits(cycle)
        
        # Verificar que se asignaron 5 hábitos
        assignments = CycleHabitAssignment.objects.filter(cycle=cycle).order_by('priority_order')
        assert assignments.count() == 5
        
        # Verificar que son los 5 con peor puntuación (0, 1, 1, 2, 2)
        scores = [a.initial_score for a in assignments]
        assert scores[0] == 0  # El peor
        assert all(score <= 2 for score in scores)  # Todos tienen score 2 o menos
    
    def test_get_current_cycle(self, user):
        """Test obtener ciclo actual"""
        # Sin ciclos
        current = CycleService.get_current_cycle(user)
        assert current is None
        
        # Con ciclo activo
        active_cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        current = CycleService.get_current_cycle(user)
        assert current == active_cycle
        
        # Con ciclo pendiente de renovación
        active_cycle.status = 'PENDING_RENEWAL'
        active_cycle.save()
        
        current = CycleService.get_current_cycle(user)
        assert current == active_cycle
        
        # Con ciclo completado (no debería devolverlo)
        active_cycle.status = 'COMPLETED'
        active_cycle.save()
        
        current = CycleService.get_current_cycle(user)
        assert current is None
    
    def test_needs_new_cycle(self, user):
        """Test verificar si necesita nuevo ciclo"""
        # Sin ciclos, necesita uno
        assert CycleService.needs_new_cycle(user) is True
        
        # Con ciclo activo sin onboarding
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        assert CycleService.needs_new_cycle(user) is False
        
        # Con ciclo activo con onboarding completado
        cycle.onboarding_completed_at = timezone.now()
        cycle.save()
        assert CycleService.needs_new_cycle(user) is False
        
        # Con ciclo pendiente de renovación
        cycle.status = 'PENDING_RENEWAL'
        cycle.save()
        assert CycleService.needs_new_cycle(user) is True
        
        # Con ciclo completado
        cycle.status = 'COMPLETED'
        cycle.save()
        assert CycleService.needs_new_cycle(user) is True
    
    def test_mark_cycle_onboarding_complete(self, user):
        """Test marcar onboarding como completado"""
        # Crear ciclo sin onboarding
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        # Marcar como completado
        result = CycleService.mark_cycle_onboarding_complete(user)
        
        assert result == cycle
        assert result.onboarding_completed_at is not None
        
        # Intentar marcar de nuevo (no debería hacer nada)
        result2 = CycleService.mark_cycle_onboarding_complete(user)
        assert result2 is None
    
    def test_check_and_update_cycle_status(self, user):
        """Test verificación automática de estado del ciclo"""
        # Crear ciclo que debería expirar
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now() - timedelta(days=31),
            end_date=timezone.now() - timedelta(days=1),
            status='ACTIVE'
        )
        
        # Obtener ciclo actual (debería actualizar estado)
        current = CycleService.get_current_cycle(user)
        
        assert current == cycle
        assert current.status == 'PENDING_RENEWAL'
    
    def test_create_cycle_without_habits(self, user):
        """Test crear ciclo cuando usuario no tiene respuestas de hábitos"""
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        # No debería fallar
        CycleService._assign_worst_habits(cycle)
        
        # No se asignan hábitos
        assignments = CycleHabitAssignment.objects.filter(cycle=cycle)
        assert assignments.count() == 0