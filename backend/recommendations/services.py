# recommendations/services.py
from django.db.models import Avg
from django.utils import timezone
from .models import RecommendationType, ConditionalRecommendation, UserRecommendation
from questionnaires.models import UserHabitAnswer, HabitQuestion
from habits.models import HabitTracker

class RecommendationService:
    """
    Servicio para gestionar las recomendaciones de los usuarios
    basadas en sus características clínicas y hábitos.
    """
    
    @staticmethod
    def generate_recommendations_for_user(user):
        """
        Genera todas las recomendaciones aplicables para un usuario,
        basado en su perfil, fenotipo y hábitos.
        """
        # Limpiar recomendaciones anteriores
        UserRecommendation.objects.filter(user=user).delete()
        
        recommendations = []
        
        # 1. Recomendaciones basadas en IMC
        recommendations.extend(
            RecommendationService._get_bmi_recommendations(user)
        )
        
        # 2. Recomendaciones basadas en factores clínicos
        recommendations.extend(
            RecommendationService._get_clinical_factor_recommendations(user)
        )
        
        # 3. Recomendaciones basadas en fenotipo
        recommendations.extend(
            RecommendationService._get_phenotype_recommendations(user)
        )
        
        # 4. Recomendaciones basadas en hábitos
        recommendations.extend(
            RecommendationService._get_habit_recommendations(user)
        )
        
        # Crear registros de UserRecommendation
        user_recommendations = []
        for rec in recommendations:
            user_recommendations.append(
                UserRecommendation(
                    user=user,
                    recommendation=rec
                )
            )
        
        # Guardar en bulk para eficiencia
        if user_recommendations:
            UserRecommendation.objects.bulk_create(user_recommendations)
        
        return user_recommendations
    
    @staticmethod
    def _get_bmi_recommendations(user):
        """Obtiene recomendaciones basadas en el IMC del usuario."""
        profile = user.profile
        recommendations = []
        
        # Solo si el usuario tiene IMC calculado y reflujo
        if profile.has_excess_weight and profile.phenotype not in ['NO_SYMPTOMS', 'UNDETERMINED']:
            # Buscar recomendaciones específicas para IMC alto
            bmi_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='BMI',
                condition_value='BMI_OVER_25',
                is_active=True
            )
            recommendations.extend(bmi_recs)
        
        return recommendations
    
    @staticmethod
    def _get_clinical_factor_recommendations(user):
        """Obtiene recomendaciones basadas en factores clínicos del usuario."""
        profile = user.profile
        recommendations = []

        # Mapeo de campos del perfil a tipos de recomendación
        factor_mapping = {
            'has_hernia': ('HERNIA', 'YES'),
            'has_altered_motility': ('MOTILITY', 'YES'),
            'has_slow_emptying': ('EMPTYING', 'YES'),
            'has_dry_mouth': ('SALIVA', 'YES'),
            'has_constipation': ('CONSTIPATION', 'YES')
        }

        # Revisar cada factor
        for profile_field, (rec_type, condition) in factor_mapping.items():
            if getattr(profile, profile_field) == 'YES':
                factor_recs = ConditionalRecommendation.objects.filter(
                    recommendation_type__type=rec_type,
                    condition_value=condition,
                    is_active=True
                )
                recommendations.extend(factor_recs)

        # Estrés/ansiedad como caso especial
        if profile.stress_affects in ['YES', 'SOMETIMES']:
            stress_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='STRESS',
                condition_value=profile.stress_affects,
                is_active=True
            )
            recommendations.extend(stress_recs)

        return recommendations
    
    @staticmethod
    def _get_phenotype_recommendations(user):
        """Obtiene recomendaciones basadas en el fenotipo del usuario."""
        phenotype = user.profile.phenotype
        
        # Solo si el usuario tiene un fenotipo determinado
        if phenotype != 'UNDETERMINED':
            phenotype_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='PHENOTYPE',
                condition_value=phenotype,
                is_active=True
            )
            return list(phenotype_recs)
        
        return []
    
    @staticmethod
    def _get_habit_recommendations(user):
        """Obtiene recomendaciones basadas en hábitos deficientes del usuario."""
        recommendations = []
        
        # Obtener respuestas de hábitos del usuario
        habit_answers = UserHabitAnswer.objects.filter(
            user=user,
            is_onboarding=True
        ).select_related('question', 'selected_option')
        
        # Para cada tipo de hábito, verificar si necesita recomendación
        for habit_type, _ in HabitQuestion.HABIT_TYPES:
            # Buscar respuesta para este tipo de hábito
            answers = [a for a in habit_answers if a.question.habit_type == habit_type]
            
            if answers:
                answer = answers[0]  # Tomar la primera/única respuesta
                score = answer.selected_option.value
                
                # Si la puntuación es baja (0 o 1), buscar recomendaciones
                if score <= 1:
                    habit_recs = ConditionalRecommendation.objects.filter(
                        recommendation_type__type='HABIT',
                        condition_value=f"{habit_type}_LOW",
                        is_active=True
                    )
                    recommendations.extend(habit_recs)
        
        return recommendations
    
    @staticmethod
    def prioritize_recommendations(user, max_recommendations=5):
        """
        Prioriza las recomendaciones del usuario, marcando las más importantes.
        Por defecto, se priorizan hasta 5 recomendaciones.
        """
        # Obtener todas las recomendaciones del usuario
        user_recommendations = UserRecommendation.objects.filter(
            user=user,
            is_read=False
        ).select_related('recommendation__recommendation_type')
        
        # Si no hay suficientes recomendaciones, no hay nada que priorizar
        if len(user_recommendations) <= max_recommendations:
            for rec in user_recommendations:
                rec.is_prioritized = True
                rec.save()
            return user_recommendations
        
        # Definir prioridades por tipo de recomendación
        priority_order = {
            'BMI': 1,
            'PHENOTYPE': 2,
            'HERNIA': 3,
            'MOTILITY': 3,
            'EMPTYING': 3,
            'SALIVA': 4,
            'CONSTIPATION': 4,
            'STRESS': 5,
            'HABIT': 6
        }
        
        # Ordenar recomendaciones por prioridad
        prioritized = sorted(
            user_recommendations,
            key=lambda x: priority_order.get(
                x.recommendation.recommendation_type.type, 10
            )
        )
        
        # Seleccionar las top N recomendaciones
        top_recommendations = prioritized[:max_recommendations]
        
        # Marcar como prioritarias
        for rec in top_recommendations:
            rec.is_prioritized = True
            rec.save()
        
        return top_recommendations

class HabitTrackingService:
    """
    Servicio para gestionar el seguimiento de hábitos para los usuarios.
    """
    
# En recommendations/services.py, reemplaza el método setup_habit_tracking con esta versión:

    @staticmethod
    def setup_habit_tracking(user, num_habits=5, include_promoted=True):
        """
        Configura el seguimiento de hábitos para un usuario basado en sus
        respuestas al cuestionario de hábitos. Se priorizan los hábitos
        con peores puntuaciones, excluyendo fumar y beber.
        
        Args:
            user: Usuario para el que configurar el seguimiento
            num_habits: Número de hábitos a seguir (excluyendo promocionados)
            include_promoted: Si incluir un hábito promocionado adicional
        """
        # Eliminar trackers existentes
        HabitTracker.objects.filter(user=user).delete()
        
        # NUEVO: Definir los tipos de hábitos a excluir
        EXCLUDED_HABIT_TYPES = ['SMOKING', 'ALCOHOL']
        
        # Obtener respuestas de hábitos del usuario
        habit_answers = UserHabitAnswer.objects.filter(
            user=user,
            is_onboarding=True
        ).select_related('question', 'selected_option')
        
        # NUEVO: Filtrar las respuestas excluyendo fumar y beber
        filtered_answers = [
            answer for answer in habit_answers 
            if answer.question.habit_type not in EXCLUDED_HABIT_TYPES
        ]
        
        # Si no hay respuestas después del filtrado, no podemos configurar seguimiento
        if not filtered_answers:
            return []
        
        # Ordenar por puntuación (peor a mejor)
        sorted_answers = sorted(
            filtered_answers,
            key=lambda x: x.selected_option.value
        )
        
        # Seleccionar los N hábitos con peor puntuación
        worst_habits = sorted_answers[:num_habits]
        
        # Crear trackers para estos hábitos
        trackers = []
        for answer in worst_habits:
            tracker = HabitTracker.objects.create(
                user=user,
                habit=answer.question,
                current_score=answer.selected_option.value,
                target_score=3  # Objetivo máximo
            )
            trackers.append(tracker)
        
        # Si se debe incluir un hábito promocionado
        if include_promoted and len(trackers) < num_habits:
            # Elegir un hábito de nivel medio (si existe)
            mid_level_answers = [
                a for a in filtered_answers 
                if a.selected_option.value == 2
            ]
            
            if mid_level_answers:
                # Tomar el primero de nivel medio que no esté ya en trackers
                for answer in mid_level_answers:
                    if answer.question.id not in [t.habit.id for t in trackers]:
                        tracker = HabitTracker.objects.create(
                            user=user,
                            habit=answer.question,
                            current_score=answer.selected_option.value,
                            target_score=3,
                            is_promoted=True
                        )
                        trackers.append(tracker)
                        break
            # Si no hay hábitos de nivel medio, tomar uno que no esté ya en trackers
            else:
                remaining_habits = [
                    a for a in filtered_answers 
                    if a.question.id not in [t.habit.id for t in trackers]
                ]
                if remaining_habits:
                    answer = remaining_habits[0]
                    tracker = HabitTracker.objects.create(
                        user=user,
                        habit=answer.question,
                        current_score=answer.selected_option.value,
                        target_score=3,
                        is_promoted=True
                    )
                    trackers.append(tracker)
        
        # NUEVO: Si después de excluir fumar y beber no llegamos a 5 hábitos,
        # asegurar que tomamos todos los disponibles
        if len(trackers) < num_habits:
            # Tomar más hábitos de los restantes hasta llegar a 5 (si es posible)
            remaining_answers = [
                a for a in filtered_answers 
                if a.question.id not in [t.habit.id for t in trackers]
            ]
            
            # Ordenar los restantes por puntuación
            remaining_sorted = sorted(
                remaining_answers,
                key=lambda x: x.selected_option.value
            )
            
            # Añadir hasta completar 5 hábitos
            for answer in remaining_sorted:
                if len(trackers) >= num_habits:
                    break
                
                tracker = HabitTracker.objects.create(
                    user=user,
                    habit=answer.question,
                    current_score=answer.selected_option.value,
                    target_score=3,
                    is_promoted=len(trackers) == 0  # El primero será promovido si no hay ninguno
                )
                trackers.append(tracker)
        
        # Log para debugging
        print(f"Usuario {user.username}: {len(trackers)} hábitos configurados para tracking")
        for tracker in trackers:
            print(f"  - {tracker.habit.habit_type}: Score {tracker.current_score}, Promovido: {tracker.is_promoted}")
        
        return trackers
    
    @staticmethod
    def log_habit(user, habit_id, date, completion_level, notes=""):
        """
        Registra el cumplimiento de un hábito en una fecha específica.
        
        Args:
            user: Usuario que registra el hábito
            habit_id: ID del hábito (HabitQuestion)
            date: Fecha del registro
            completion_level: Nivel de cumplimiento (0-3)
            notes: Notas adicionales
        """
        # Buscar el tracker para este hábito y usuario
        try:
            tracker = HabitTracker.objects.get(user=user, habit_id=habit_id)
        except HabitTracker.DoesNotExist:
            # Si no existe, intentar crearlo
            try:
                habit = HabitQuestion.objects.get(id=habit_id)
                tracker = HabitTracker.objects.create(
                    user=user,
                    habit=habit,
                    current_score=0
                )
            except HabitQuestion.DoesNotExist:
                return None
        
        # Crear o actualizar el log para esta fecha
        from habits.models import HabitLog
        log, created = HabitLog.objects.update_or_create(
            tracker=tracker,
            date=date,
            defaults={
                'completion_level': completion_level,
                'notes': notes
            }
        )
        
        # Actualizar la puntuación actual del hábito (promedio de los últimos 7 días)
        recent_logs = HabitLog.objects.filter(
            tracker=tracker,
            date__gte=timezone.now().date() - timezone.timedelta(days=7)
        ).aggregate(avg_score=Avg('completion_level'))
        
        if recent_logs['avg_score'] is not None:
            tracker.current_score = round(recent_logs['avg_score'])
            tracker.save()
        
        # Actualizar la racha del hábito
        HabitTrackingService._update_streak(tracker, date, completion_level)
        
        return log
    
    @staticmethod
    def _update_streak(tracker, log_date, completion_level):
        """
        Actualiza la racha del hábito basado en el nuevo registro.
        """
        from habits.models import HabitStreak
        
        # Obtener o crear objeto de racha
        streak, created = HabitStreak.objects.get_or_create(tracker=tracker)
        
        # Considerar el hábito como completado si el nivel es 2 o 3
        is_completed = completion_level >= 2
        
        # Si es la primera vez que se registra
        if created or streak.last_log_date is None:
            if is_completed:
                streak.current_streak = 1
                streak.longest_streak = 1
            streak.last_log_date = log_date
            streak.save()
            return streak
        
        # Calcular días desde el último registro
        days_diff = (log_date - streak.last_log_date).days
        
        # Si es el día siguiente o el mismo día (actualización)
        if days_diff <= 1:
            if is_completed:
                # Incrementar racha si completó el hábito
                if days_diff == 1 or (days_diff == 0 and streak.current_streak == 0):
                    streak.current_streak += 1
                    # Actualizar racha más larga si corresponde
                    if streak.current_streak > streak.longest_streak:
                        streak.longest_streak = streak.current_streak
            else:
                # Resetear racha si no completó el hábito
                streak.current_streak = 0
        else:
            # Si pasó más de un día, resetear la racha
            if is_completed:
                streak.current_streak = 1
            else:
                streak.current_streak = 0
        
        streak.last_log_date = log_date
        streak.save()
        
        return streak