# cycles/services.py
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import UserCycle, CycleSnapshot, CycleHabitAssignment
from questionnaires.models import UserHabitAnswer, HabitQuestion
from profiles.models import UserProfile

class CycleService:
    @staticmethod
    @transaction.atomic
    def create_new_cycle(user, is_first_cycle=False):
        """
        Crea un nuevo ciclo para el usuario.
        """
        # Determinar número de ciclo
        last_cycle = UserCycle.objects.filter(user=user).order_by('-cycle_number').first()
        cycle_number = 1 if not last_cycle else last_cycle.cycle_number + 1
        
        # Si hay un ciclo anterior, marcarlo como completado
        if last_cycle and last_cycle.status == 'PENDING_RENEWAL':
            last_cycle.status = 'COMPLETED'
            last_cycle.save()
        
        # Crear nuevo ciclo
        new_cycle = UserCycle.objects.create(
            user=user,
            cycle_number=cycle_number,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        return new_cycle
    
    @staticmethod
    def complete_cycle_onboarding(cycle, gerdq_score, rsi_score, phenotype, program):
        """
        Completa el onboarding del ciclo con los resultados.
        """
        cycle.gerdq_score = gerdq_score
        cycle.rsi_score = rsi_score
        cycle.phenotype = phenotype
        cycle.program = program
        cycle.onboarding_completed_at = timezone.now()
        cycle.save()
        
        # Crear snapshot del estado actual
        CycleService._create_cycle_snapshot(cycle)
        
        # Asignar los 5 peores hábitos para tracking
        CycleService._assign_worst_habits(cycle)
        
        return cycle
    
    @staticmethod
    def _create_cycle_snapshot(cycle):
        """
        Crea una captura del estado del usuario al inicio del ciclo.
        """
        profile = cycle.user.profile
        
        # Obtener puntuaciones de hábitos actuales
# Obtener puntuaciones de hábitos actuales
        habit_answers = UserHabitAnswer.objects.filter(
            user=cycle.user,
            answered_at__lte=cycle.start_date + timedelta(days=1)
        ).select_related('question', 'selected_option').order_by(
            'question__id', '-answered_at'  # ← Cambiar a question__id
        ).distinct('question')
        
        habit_scores = {}
        for answer in habit_answers:
            habit_scores[answer.question.habit_type] = answer.selected_option.value
        
        snapshot = CycleSnapshot.objects.create(
            cycle=cycle,
            weight_kg=profile.weight_kg,
            height_cm=profile.height_cm,
            bmi=profile.bmi,
            has_hernia=profile.has_hernia,
            has_altered_motility=profile.has_altered_motility,
            has_slow_emptying=profile.has_slow_emptying,
            has_dry_mouth=profile.has_dry_mouth,
            has_constipation=profile.has_constipation,
            stress_affects=profile.stress_affects,
            endoscopy_result=profile.endoscopy_result,
            ph_monitoring_result=profile.ph_monitoring_result,
            habit_scores=habit_scores
        )
        
        return snapshot
    
    @staticmethod
    def _assign_worst_habits(cycle):
        """
        Asigna los 5 peores hábitos del usuario para tracking en este ciclo.
        """
        # Obtener las últimas respuestas de hábitos
        latest_answers = {}
        habit_answers = UserHabitAnswer.objects.filter(
            user=cycle.user
        ).select_related('question', 'selected_option').order_by('-answered_at')
        
        # Obtener la respuesta más reciente para cada hábito
        for answer in habit_answers:
            if answer.question.id not in latest_answers:
                latest_answers[answer.question.id] = answer
        
        # Ordenar por puntuación (menor es peor)
        worst_habits = sorted(
            latest_answers.values(),
            key=lambda x: x.selected_option.value
        )[:5]
        
        # Crear asignaciones
        for i, answer in enumerate(worst_habits, 1):
            CycleHabitAssignment.objects.create(
                cycle=cycle,
                habit=answer.question,
                initial_score=answer.selected_option.value,
                priority_order=i
            )
    
    @staticmethod
    def get_current_cycle(user):
        """
        Obtiene el ciclo actual del usuario.
        """
        cycle = UserCycle.objects.filter(
            user=user,
            status__in=['ACTIVE', 'PENDING_RENEWAL']
        ).first()
        
        if cycle:
            cycle.check_and_update_status()
        
        return cycle
    
    @staticmethod
    def needs_new_cycle(user):
        """
        Verifica si el usuario necesita iniciar un nuevo ciclo.
        """
        current_cycle = CycleService.get_current_cycle(user)
        
        if not current_cycle:
            return True
        
        if current_cycle.status == 'PENDING_RENEWAL':
            return True
        
        # Si el ciclo está activo pero no tiene onboarding completado
        if current_cycle.status == 'ACTIVE' and not current_cycle.onboarding_completed_at:
            return False  # Debe completar el onboarding actual
        
        return False
    
    def mark_cycle_onboarding_complete(user):
        """
        Marca el ciclo actual como onboarding completado.
        """
        from django.utils import timezone
        
        current_cycle = UserCycle.objects.filter(
            user=user,
            status='ACTIVE'
        ).first()
        
        if current_cycle and not current_cycle.onboarding_completed_at:
            current_cycle.onboarding_completed_at = timezone.now()
            current_cycle.save()
            return current_cycle
        
        return None