# recommendations/services.py - VERSIÓN CORREGIDA

from django.db.models import Avg
from django.utils import timezone
from .models import RecommendationType, ConditionalRecommendation, UserRecommendation
from questionnaires.models import UserHabitAnswer, HabitQuestion
from habits.models import HabitTracker

class RecommendationService:
    """
    Servicio para gestionar las recomendaciones de los usuarios
    basadas en IMC, factores clínicos y hábitos específicos (SMOKING y ALCOHOL).
    """
    
    @staticmethod
    def generate_recommendations_for_user(user):
        """
        Genera recomendaciones aplicables para un usuario,
        basado en IMC, factores clínicos y hábitos específicos.
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
        
        # 3. 🔥 NUEVO: Recomendaciones basadas en hábitos específicos (SMOKING y ALCOHOL)
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
        
        # Solo si el usuario tiene IMC elevado
        if getattr(profile, 'has_excess_weight', False):
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

        # 1. Factores que se activan solo con 'YES'
        yes_only_factors = {
            'has_hernia': 'HERNIA',
            'has_gastritis': 'GASTRITIS', 
            'has_altered_motility': 'MOTILITY',
            'has_slow_emptying': 'EMPTYING',
            'has_dry_mouth': 'SALIVA',
            'has_intestinal_disorders': 'INTESTINAL'
        }

        for profile_field, rec_type in yes_only_factors.items():
            field_value = getattr(profile, profile_field, 'NO')
            if field_value == 'YES':
                factor_recs = ConditionalRecommendation.objects.filter(
                    recommendation_type__type=rec_type,
                    condition_value='YES',
                    is_active=True
                )
                recommendations.extend(factor_recs)
                print(f"🏥 {profile_field}=YES detectado para {user.username}: {len(factor_recs)} recomendaciones")

        # 2. Helicobacter pylori (casos especiales)
        h_pylori_status = getattr(profile, 'h_pylori_status', 'NO')
        if h_pylori_status == 'ACTIVE':
            h_pylori_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='H_PYLORI',
                condition_value='ACTIVE',
                is_active=True
            )
            recommendations.extend(h_pylori_recs)
            print(f"🦠 H.pylori ACTIVE detectado para {user.username}: {len(h_pylori_recs)} recomendaciones")
        elif h_pylori_status == 'TREATED':
            h_pylori_treated_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='H_PYLORI',
                condition_value='TREATED',
                is_active=True
            )
            recommendations.extend(h_pylori_treated_recs)
            print(f"🦠 H.pylori TREATED detectado para {user.username}: {len(h_pylori_treated_recs)} recomendaciones")

        # 3. Estreñimiento (YES o SOMETIMES activan recomendaciones)
        constipation_level = getattr(profile, 'has_constipation', 'NO')
        if constipation_level in ['YES', 'SOMETIMES']:
            constipation_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='CONSTIPATION',
                condition_value__in=['YES', 'SOMETIMES'],
                is_active=True
            )
            recommendations.extend(constipation_recs)
            print(f"💩 Estreñimiento {constipation_level} detectado para {user.username}: {len(constipation_recs)} recomendaciones")

        # 4. Estrés/ansiedad (YES o SOMETIMES)
        stress_level = getattr(profile, 'stress_affects', 'NO')
        if stress_level in ['YES', 'SOMETIMES']:
            stress_recs = ConditionalRecommendation.objects.filter(
                recommendation_type__type='STRESS',
                condition_value__in=['YES', 'SOMETIMES'],
                is_active=True
            )
            recommendations.extend(stress_recs)
            print(f"😰 Estrés {stress_level} detectado para {user.username}: {len(stress_recs)} recomendaciones")

        return recommendations
    
    @staticmethod
    def _get_habit_recommendations(user):
        """🔥 NUEVO: Obtiene recomendaciones basadas en respuestas de hábitos específicos."""
        recommendations = []
        
        try:
            # 1. 🚬 SMOKING - Pregunta 4
            smoking_answer = UserHabitAnswer.objects.filter(
                user=user,
                question__habit_type='SMOKING',
                is_onboarding=True
            ).first()
            
            if smoking_answer:
                smoking_value = smoking_answer.selected_option.value
                # Si fuma (valores 0 o 1 = "Sí, todos los días" o "Sí, ocasionalmente")
                if smoking_value in [0, 1]:
                    smoking_recs = ConditionalRecommendation.objects.filter(
                        recommendation_type__type='SMOKING',
                        condition_value='YES',
                        is_active=True
                    )
                    recommendations.extend(smoking_recs)
                    print(f"🚬 SMOKING={smoking_value} detectado para {user.username}: {len(smoking_recs)} recomendaciones")
            
            # 2. 🍷 ALCOHOL - Pregunta 5
            alcohol_answer = UserHabitAnswer.objects.filter(
                user=user,
                question__habit_type='ALCOHOL',
                is_onboarding=True
            ).first()
            
            if alcohol_answer:
                alcohol_value = alcohol_answer.selected_option.value
                # Si bebe alcohol (valores 0, 1, 2 = "Sí, frecuentemente", "Sí, a veces", "Muy ocasionalmente")
                if alcohol_value in [0, 1, 2]:
                    alcohol_recs = ConditionalRecommendation.objects.filter(
                        recommendation_type__type='ALCOHOL',
                        condition_value='YES',
                        is_active=True
                    )
                    recommendations.extend(alcohol_recs)
                    print(f"🍷 ALCOHOL={alcohol_value} detectado para {user.username}: {len(alcohol_recs)} recomendaciones")
            
        except Exception as e:
            print(f"❌ Error al procesar recomendaciones de hábitos para {user.username}: {str(e)}")
        
        return recommendations
    
    @staticmethod
    def prioritize_recommendations(user, max_recommendations=5):
        """
        Prioriza las recomendaciones del usuario, marcando las más importantes.
        """
        user_recommendations = UserRecommendation.objects.filter(
            user=user,
            is_read=False
        ).select_related('recommendation__recommendation_type')
        
        if len(user_recommendations) <= max_recommendations:
            for rec in user_recommendations:
                rec.is_prioritized = True
                rec.save()
            return user_recommendations
        
        # Definir prioridades expandidas
        priority_order = {
            'BMI': 1,               # IMC - Más importante
            'H_PYLORI': 2,          # H. pylori activo - Crítico
            'HERNIA': 3,            # Factores estructurales
            'MOTILITY': 3,
            'EMPTYING': 3,
            'GASTRITIS': 4,         # Inflamación activa
            'SALIVA': 5,            # Factores funcionales
            'CONSTIPATION': 5,
            'INTESTINAL': 5,
            'STRESS': 6,            # Factores psicosomáticos
            'SMOKING': 7,           # Hábitos nocivos
            'ALCOHOL': 7
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

# HabitTrackingService sin cambios
class HabitTrackingService:
    @staticmethod
    def setup_habit_tracking(user, num_habits=5):
        HabitTracker.objects.filter(user=user).delete()
        
        EXCLUDED_HABIT_TYPES = ['SMOKING', 'ALCOHOL']
        
        habit_answers = UserHabitAnswer.objects.filter(
            user=user,
            is_onboarding=True
        ).select_related('question', 'selected_option')
        
        filtered_answers = [
            answer for answer in habit_answers 
            if answer.question.habit_type not in EXCLUDED_HABIT_TYPES
        ]
        
        if not filtered_answers:
            print(f"Usuario {user.username}: No hay hábitos válidos para configurar")
            return []
        
        sorted_answers = sorted(
            filtered_answers,
            key=lambda x: x.selected_option.value
        )
        
        worst_habits = sorted_answers[:num_habits]
        
        trackers = []
        promoted_habit = None
        
        for i, answer in enumerate(worst_habits):
            is_promoted = (i == 0)
            
            tracker = HabitTracker.objects.create(
                user=user,
                habit=answer.question,
                current_score=answer.selected_option.value,
                target_score=3,
                is_promoted=is_promoted
            )
            trackers.append(tracker)
            
            if is_promoted:
                promoted_habit = tracker
        
        print(f"Usuario {user.username}: {len(trackers)} hábitos configurados para tracking")
        
        return trackers, promoted_habit