# profiles/services.py

from .models import UserProfile
from questionnaires.models import QuestionnaireCompletion

class PhenotypeClassificationService:
    """
    Servicio para clasificar el fenotipo del paciente según la Guía ERGE 2019
    basado en los resultados de los cuestionarios (GERDq y RSI) y pruebas diagnósticas.
    """
    
    @staticmethod
    def get_questionnaire_results(user):
        """
        Obtiene los resultados más recientes de los cuestionarios GERDq y RSI.
        Retorna una tupla de (gerdq_positive, rsi_positive).
        """
        # Obtener el último resultado de GERDq
        last_gerdq = QuestionnaireCompletion.objects.filter(
            user=user,
            questionnaire__type='GERDQ'
        ).order_by('-completed_at').first()
        
        # Obtener el último resultado de RSI
        last_rsi = QuestionnaireCompletion.objects.filter(
            user=user,
            questionnaire__type='RSI'
        ).order_by('-completed_at').first()
        
        # Verificar si los cuestionarios son positivos
        gerdq_score = last_gerdq.score if last_gerdq else None
        rsi_score = last_rsi.score if last_rsi else None
        
        gerdq_positive = gerdq_score >= 8 if gerdq_score is not None else False
        rsi_positive = rsi_score >= 13 if rsi_score is not None else False
        
        return gerdq_positive, rsi_positive
    
    @staticmethod
    def get_diagnostic_tests(profile):
        """
        Obtiene los resultados de las pruebas diagnósticas del perfil.
        Retorna una tupla de (endoscopy_positive, ph_positive, ph_negative).
        """
        # Verificar resultado de la endoscopia
        endoscopy_positive = profile.has_endoscopy and profile.endoscopy_result and profile.endoscopy_result.startswith('ESOPHAGITIS_')
        
        # Verificar resultado de la pH-metría
        ph_positive = profile.has_ph_monitoring and profile.ph_monitoring_result == 'POSITIVE'
        ph_negative = profile.has_ph_monitoring and profile.ph_monitoring_result == 'NEGATIVE'
        
        return endoscopy_positive, ph_positive, ph_negative
    
    @staticmethod
    def determine_scenario(gerdq_positive, rsi_positive, endoscopy_done, endoscopy_positive, 
                           ph_done, ph_positive, ph_negative):
        """
        Determina el escenario (A-M) según la combinación de resultados.
        """
        
        # === CASOS CON ENDOSCOPIA POSITIVA (Prioridad máxima) ===
        if endoscopy_done and endoscopy_positive:
            if gerdq_positive:
                return 'A'  # ERGE erosiva sintomática
            elif not gerdq_positive and not rsi_positive:
                return 'J'  # ERGE erosiva silente
            # Si tiene RSI+ y esofagitis, sigue siendo A
            else:
                return 'A'
        
        # === CASOS CON pH-METRÍA POSITIVA ===
        if ph_done and ph_positive:
            if gerdq_positive and rsi_positive and endoscopy_done and not endoscopy_positive:
                return 'M'  # NERD mixto
            elif gerdq_positive and endoscopy_done and not endoscopy_positive:
                return 'B'  # NERD clásico
            elif not gerdq_positive and not rsi_positive and endoscopy_done and not endoscopy_positive:
                return 'K'  # NERD silente
        
        # === CASOS CON pH-METRÍA NEGATIVA ===
        if ph_done and ph_negative:
            if gerdq_positive and endoscopy_done and not endoscopy_positive:
                return 'D'  # Funcional
            elif rsi_positive and not gerdq_positive and endoscopy_done and not endoscopy_positive:
                return 'L'  # Extraesofágico sin reflujo
            elif not gerdq_positive and not rsi_positive and endoscopy_done and not endoscopy_positive:
                return 'H'  # Sano evaluado
        
        # === CASOS CON SOLO ENDOSCOPIA (sin pH) ===
        # Escenario C: RSI+ con endoscopia normal, sin pH
        if rsi_positive and endoscopy_done and not endoscopy_positive and not ph_done:
            return 'C'
        
        # === CASOS SIN PRUEBAS ===
        if not endoscopy_done and not ph_done:
            if gerdq_positive and rsi_positive:
                return 'G'  # Mixto sin evaluar
            elif gerdq_positive and not rsi_positive:
                return 'E'  # Digestivo sin evaluar
            elif not gerdq_positive and rsi_positive:
                return 'F'  # Extraesofágico sin evaluar
            elif not gerdq_positive and not rsi_positive:
                return 'I'  # Sin síntomas sin evaluar
        
        return None
    
    @staticmethod
    def determine_phenotype(scenario):
        """
        Determina el fenotipo basado en el escenario.
        """
        if scenario in ['A', 'J']:
            return 'EROSIVE'
        elif scenario in ['B', 'K']:
            return 'NERD'
        elif scenario == 'M':
            return 'NERD_MIXED'
        elif scenario in ['C', 'L']:
            return 'EXTRAESOPHAGEAL'
        elif scenario == 'D':
            return 'FUNCTIONAL'
        elif scenario == 'E':
            return 'SYMPTOMS_NO_TESTS'
        elif scenario == 'F':
            return 'EXTRAESOPHAGEAL_NO_TESTS'
        elif scenario == 'G':
            return 'SYMPTOMS_MIXED_NO_TESTS'
        elif scenario in ['H', 'I']:
            return 'NO_SYMPTOMS'
        else:
            return 'UNDETERMINED'
    
    @staticmethod
    def classify_user(user):
        """
        Clasifica al usuario según sus cuestionarios y pruebas diagnósticas.
        """
        profile = user.profile
        
        # Obtener resultados de cuestionarios
        gerdq_positive, rsi_positive = PhenotypeClassificationService.get_questionnaire_results(user)
        
        # Obtener resultados de pruebas diagnósticas
        endoscopy_positive, ph_positive, ph_negative = PhenotypeClassificationService.get_diagnostic_tests(profile)
        
        # Determinar si se han realizado las pruebas
        endoscopy_done = profile.has_endoscopy
        ph_done = profile.has_ph_monitoring
        
        # Determinar escenario
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive, rsi_positive, 
            endoscopy_done, endoscopy_positive,
            ph_done, ph_positive, ph_negative
        )
        
        # Determinar fenotipo
        phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
        
        # Actualizar perfil
        profile.scenario = scenario
        profile.phenotype = phenotype
        profile.save()
        
        return {
            'scenario': scenario,
            'phenotype': phenotype
        }