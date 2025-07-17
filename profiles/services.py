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
        Retorna una tupla de (endoscopy_positive, ph_positive).
        """
        # Verificar resultado de la endoscopia
        endoscopy_positive = profile.has_endoscopy and profile.endoscopy_result.startswith('ESOPHAGITIS_')
        
        # Verificar resultado de la pH-metría
        ph_positive = profile.has_ph_monitoring and profile.ph_monitoring_result == 'POSITIVE'
        ph_negative = profile.has_ph_monitoring and profile.ph_monitoring_result == 'NEGATIVE'
        
        return endoscopy_positive, ph_positive, ph_negative
    
    @staticmethod
    def determine_scenario(gerdq_positive, rsi_positive, endoscopy_done, endoscopy_positive, 
                           ph_done, ph_positive, ph_negative):
        """
        Determina el escenario (A-L) según la combinación de resultados.
        """
        # Escenario A: GERDq+, Endoscopia positiva (esofagitis)
        if gerdq_positive and endoscopy_done and endoscopy_positive:
            return 'A'
        
        # Escenario B: GERDq+, Endoscopia normal, pH+ (NERD)
        if gerdq_positive and endoscopy_done and not endoscopy_positive and ph_done and ph_positive:
            return 'B'
        
        # Escenario C: RSI+, Endoscopia normal o no hecha (Extraesofágico)
        if rsi_positive and (not endoscopy_done or (endoscopy_done and not endoscopy_positive)):
            return 'C'
        
        # Escenario D: GERDq+, Endoscopia normal, pH- (Funcional)
        if gerdq_positive and endoscopy_done and not endoscopy_positive and ph_done and ph_negative:
            return 'D'
        
        # Escenario E: GERDq+, Sin pruebas
        if gerdq_positive and not endoscopy_done and not ph_done:
            return 'E'
        
        # Escenario F: RSI+, Sin pruebas
        if rsi_positive and not endoscopy_done and not ph_done:
            return 'F'
        
        # Escenario G: GERDq+, Endoscopia normal, pH desconocido
        if gerdq_positive and endoscopy_done and not endoscopy_positive and (not ph_done or (ph_done and not ph_positive and not ph_negative)):
            return 'G'
        
        # Escenario H: Cuestionarios negativos, Endoscopia normal, pH-
        if not gerdq_positive and not rsi_positive and endoscopy_done and not endoscopy_positive and ph_done and ph_negative:
            return 'H'
        
        # Escenario I: Sin síntomas ni pruebas
        if not gerdq_positive and not rsi_positive and not endoscopy_done and not ph_done:
            return 'I'
        
        # Escenario J: Sin síntomas, Endoscopia positiva (silente)
        if not gerdq_positive and not rsi_positive and endoscopy_done and endoscopy_positive:
            return 'J'
        
        # Escenario K: Sin síntomas, Endoscopia normal, pH+
        if not gerdq_positive and not rsi_positive and endoscopy_done and not endoscopy_positive and ph_done and ph_positive:
            return 'K'
        
        # Escenario L: RSI+, Endoscopia normal, pH-
        if not gerdq_positive and rsi_positive and endoscopy_done and not endoscopy_positive and ph_done and ph_negative:
            return 'L'
        
        # Si no coincide con ningún escenario definido
        return None
    
    @staticmethod
    def determine_phenotype(scenario):
        """
        Determina el fenotipo basado en el escenario y siguiendo la prioridad clínica.
        """
        if scenario in ['A', 'J']:
            return 'EROSIVE'
        elif scenario in ['B', 'K']:
            return 'NERD'
        elif scenario in ['C', 'L']:
            return 'EXTRAESOPHAGEAL'
        elif scenario in ['D', 'H']:
            return 'FUNCTIONAL'
        elif scenario in ['E', 'G']:
            return 'SYMPTOMS_NO_TESTS'
        elif scenario == 'F':
            return 'EXTRAESOPHAGEAL_NO_TESTS'
        elif scenario == 'I':
            return 'NO_SYMPTOMS'
        else:
            return 'UNDETERMINED'
    
    @staticmethod
    def classify_user(user):
        """
        Clasifica al usuario según sus cuestionarios y pruebas diagnósticas.
        Actualiza el perfil con el escenario y fenotipo correspondientes.
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