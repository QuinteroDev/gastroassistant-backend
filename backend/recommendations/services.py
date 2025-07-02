# recommendations/services.py - Versión corregida

from django.db.models import Avg
from django.utils import timezone
from .models import RecommendationType, ConditionalRecommendation, UserRecommendation
from questionnaires.models import UserHabitAnswer, HabitQuestion
from habits.models import HabitTracker

class RecommendationService:
    """
    Servicio para gestionar las recomendaciones de los usuarios
    basadas únicamente en IMC y factores clínicos.
    """
    
    @staticmethod
    def generate_recommendations_for_user(user):
        """
        Genera recomendaciones aplicables para un usuario,
        basado SOLO en IMC y factores clínicos.
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
        
        # ❌ ELIMINADO: Recomendaciones basadas en fenotipo
        # ❌ ELIMINADO: Recomendaciones basadas en hábitos
        
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
        
        # Solo si el usuario tiene IMC elevado
        if getattr(profile, 'has_excess_weight', False):
            # Buscar recomendaciones específicas para IMC alto
            bmi_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='BMI',
                condition_value='BMI_OVER_25',
                is_active=True
            )
            recommendations.extend(bmi_recs)
            
            print(f"💪 IMC elevado detectado para {user.username}: {len(bmi_recs)} recomendaciones encontradas")
        
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
            field_value = getattr(profile, profile_field, 'NO')
            if field_value == 'YES':
                factor_recs = ConditionalRecommendation.objects.filter(
                    recommendation_type__type=rec_type,
                    condition_value=condition,
                    is_active=True
                )
                recommendations.extend(factor_recs)
                
                print(f"🏥 Factor clínico {profile_field} detectado para {user.username}: {len(factor_recs)} recomendaciones")

        # Estrés/ansiedad como caso especial
        stress_level = getattr(profile, 'stress_affects', 'NO')
        if stress_level in ['YES', 'SOMETIMES']:
            stress_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='STRESS',
                condition_value=stress_level,
                is_active=True
            )
            recommendations.extend(stress_recs)
            
            print(f"😰 Estrés nivel {stress_level} detectado para {user.username}: {len(stress_recs)} recomendaciones")

        return recommendations
    
    @staticmethod
    def prioritize_recommendations(user, max_recommendations=5):
        """
        Prioriza las recomendaciones del usuario, marcando las más importantes.
        Orden de prioridad ajustado para solo IMC y factores clínicos.
        """
        # Obtener todas las recomendaciones del usuario
        user_recommendations = UserRecommendation.objects.filter(
            user=user,
            is_read=False
        ).select_related('recommendation__recommendation_type')
        
        # Si no hay suficientes recomendaciones, marcar todas como prioritarias
        if len(user_recommendations) <= max_recommendations:
            for rec in user_recommendations:
                rec.is_prioritized = True
                rec.save()
            return user_recommendations
        
        # Definir prioridades SOLO para IMC y factores clínicos
        priority_order = {
            'BMI': 1,           # IMC - Más importante
            'HERNIA': 2,        # Factores clínicos estructurales
            'MOTILITY': 2,
            'EMPTYING': 2,
            'SALIVA': 3,        # Factores clínicos funcionales
            'CONSTIPATION': 3,
            'STRESS': 4         # Factores psicosomáticos
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
        
        print(f"⭐ {len(top_recommendations)} recomendaciones marcadas como prioritarias para {user.username}")
        
        return top_recommendations

# MANTENER: HabitTrackingService sin cambios (es independiente del sistema de recomendaciones)

class HabitTrackingService:
    """
    Servicio para gestionar el seguimiento de hábitos para los usuarios.
    Este servicio es independiente del sistema de recomendaciones.
    """
    
    @staticmethod
    def setup_habit_tracking(user, num_habits=5):
        """
        Configura el seguimiento de hábitos para un usuario basado en sus
        respuestas al cuestionario de hábitos. Se priorizan los hábitos
        con peores puntuaciones, excluyendo fumar y beber.
        
        El hábito con PEOR puntuación se marca como PROMOCIONADO.
        """
        # Eliminar trackers existentes
        HabitTracker.objects.filter(user=user).delete()
        
        # Tipos de hábitos a excluir (fumar y beber)
        EXCLUDED_HABIT_TYPES = ['SMOKING', 'ALCOHOL']
        
        # Obtener respuestas de hábitos del usuario
        habit_answers = UserHabitAnswer.objects.filter(
            user=user,
            is_onboarding=True
        ).select_related('question', 'selected_option')
        
        # Filtrar respuestas excluyendo fumar y beber
        filtered_answers = [
            answer for answer in habit_answers 
            if answer.question.habit_type not in EXCLUDED_HABIT_TYPES
        ]
        
        if not filtered_answers:
            print(f"Usuario {user.username}: No hay hábitos válidos para configurar")
            return []
        
        # Ordenar por puntuación (peor a mejor)
        sorted_answers = sorted(
            filtered_answers,
            key=lambda x: x.selected_option.value
        )
        
        # Tomar los N peores hábitos
        worst_habits = sorted_answers[:num_habits]
        
        # Crear trackers
        trackers = []
        promoted_habit = None
        
        for i, answer in enumerate(worst_habits):
            # EL PRIMER HÁBITO (peor puntuación) será el PROMOCIONADO
            is_promoted = (i == 0)
            
            tracker = HabitTracker.objects.create(
                user=user,
                habit=answer.question,
                current_score=answer.selected_option.value,
                target_score=3,
                is_promoted=is_promoted
            )
            trackers.append(tracker)
            
            # Guardar referencia del hábito promocionado
            if is_promoted:
                promoted_habit = tracker
        
        # Log para debugging
        print(f"Usuario {user.username}: {len(trackers)} hábitos configurados para tracking")
        for tracker in trackers:
            print(f"  - {tracker.habit.habit_type}: Score {tracker.current_score}, Promovido: {tracker.is_promoted}")
        
        if promoted_habit:
            print(f"  ✅ HÁBITO PROMOCIONADO: {promoted_habit.habit.habit_type} (Score: {promoted_habit.current_score})")
        
        return trackers, promoted_habit

    # ... resto de métodos de HabitTrackingService sin cambios ...