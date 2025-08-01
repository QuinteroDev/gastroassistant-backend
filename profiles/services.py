# profiles/services.py

from .models import UserProfile
from questionnaires.models import QuestionnaireCompletion

class PhenotypeClassificationService:
    """
    Servicio para clasificar el fenotipo del paciente según la Guía ERGE 2019
    basado en los resultados de los cuestionarios (GERDq y RSI) y pruebas diagnósticas.
    Actualizado con la nueva lógica de clasificación.
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
        Determina el escenario (A-R) según la combinación de resultados.
        Actualizado con la nueva lógica de clasificación.
        """
        
        # === REGLA 1: ENDOSCOPIA POSITIVA (Máxima prioridad) ===
        if endoscopy_done and endoscopy_positive:
            return 'A'  # Siempre ERGE erosiva
        
        # === REGLA 2: AMBOS CUESTIONARIOS NEGATIVOS ===
        # Si GERDq- y RSI- → Siempre Bloque 6 (excepto endoscopia positiva ya manejada arriba)
        if not gerdq_positive and not rsi_positive:
            if endoscopy_done and not endoscopy_positive:
                if ph_done and ph_positive:
                    return 'E'  # Endoscopia negativa + pH positiva + sin síntomas
                elif ph_done and ph_negative:
                    return 'F4'  # Endoscopia negativa + pH negativa + sin síntomas
                else:
                    return 'J'  # Endoscopia negativa + pH no hecha + sin síntomas
            elif not endoscopy_done:
                if ph_done:
                    return 'N'  # Endoscopia no hecha + pH hecha + sin síntomas
                else:
                    return 'R'  # Sin pruebas + sin síntomas
        
        # === REGLA 3: ENDOSCOPIA NEGATIVA + pH POSITIVA ===
        if endoscopy_done and not endoscopy_positive and ph_done and ph_positive:
            if gerdq_positive and rsi_positive:
                return 'B'  # NERD Mixto
            elif gerdq_positive and not rsi_positive:
                return 'C'  # NERD clásico
            elif not gerdq_positive and rsi_positive:
                return 'D'  # Extraesofágico con reflujo
        
        # === REGLA 4: ENDOSCOPIA NEGATIVA + pH NEGATIVA ===
        # Todos van al perfil funcional si tienen síntomas
        if endoscopy_done and not endoscopy_positive and ph_done and ph_negative:
            if gerdq_positive and rsi_positive:
                return 'F'  # Funcional con síntomas mixtos
            elif gerdq_positive and not rsi_positive:
                return 'F2'  # Funcional con síntomas digestivos
            elif not gerdq_positive and rsi_positive:
                return 'F3'  # Funcional con síntomas extraesofágicos
        
        # === REGLA 5: SIN PRUEBAS COMPLETAS ===
        # Casos con endoscopia negativa pero sin pH
        if endoscopy_done and not endoscopy_positive and not ph_done:
            if gerdq_positive and rsi_positive:
                return 'G'  # Mixto sin pH
            elif gerdq_positive and not rsi_positive:
                return 'H'  # Digestivo sin pH
            elif not gerdq_positive and rsi_positive:
                return 'I'  # Extraesofágico sin pH
        
        # Casos con pH pero sin endoscopia
        if not endoscopy_done and ph_done:
            if gerdq_positive and rsi_positive:
                return 'K'  # Mixto sin endoscopia
            elif gerdq_positive and not rsi_positive:
                return 'L'  # Digestivo sin endoscopia
            elif not gerdq_positive and rsi_positive:
                return 'M'  # Extraesofágico sin endoscopia
        
        # Casos sin ninguna prueba
        if not endoscopy_done and not ph_done:
            if gerdq_positive and rsi_positive:
                return 'O'  # Mixto sin pruebas
            elif gerdq_positive and not rsi_positive:
                return 'P'  # Digestivo sin pruebas
            elif not gerdq_positive and rsi_positive:
                return 'Q'  # Extraesofágico sin pruebas
        
        return None
    
    @staticmethod
    def determine_phenotype(scenario):
        """
        Determina el fenotipo basado en el escenario.
        Mapeo actualizado según la nueva tabla.
        """
        # Mapa de escenarios a bloques
        scenario_to_block = {
            'A': 1,   # ERGE Erosiva
            'B': 9,   # NERD Mixto
            'C': 2,   # NERD
            'D': 3,   # Reflujo Extraesofágico
            'E': 6,   # Bienestar Digestivo (CAMBIADO)
            'F': 4,   # Perfil Funcional
            'F2': 4,  # Perfil Funcional
            'F3': 4,  # Perfil Funcional
            'F4': 6,  # Bienestar Digestivo
            'G': 8,   # Perfil Mixto sin Pruebas
            'H': 5,   # Síntomas Digestivos sin Pruebas
            'I': 7,   # Síntomas Extraesofágicos sin Pruebas
            'J': 6,   # Bienestar Digestivo
            'K': 8,   # Perfil Mixto sin Pruebas
            'L': 5,   # Síntomas Digestivos sin Pruebas
            'M': 7,   # Síntomas Extraesofágicos sin Pruebas
            'N': 6,   # Bienestar Digestivo
            'O': 8,   # Perfil Mixto sin Pruebas
            'P': 5,   # Síntomas Digestivos sin Pruebas
            'Q': 7,   # Síntomas Extraesofágicos sin Pruebas
            'R': 6,   # Bienestar Digestivo
        }
        
        # Mapa de bloques a fenotipos
        block_to_phenotype = {
            1: 'EROSIVE',
            2: 'NERD',
            3: 'EXTRAESOPHAGEAL',
            4: 'FUNCTIONAL',
            5: 'SYMPTOMS_NO_TESTS',
            6: 'NO_SYMPTOMS',
            7: 'EXTRAESOPHAGEAL_NO_TESTS',
            8: 'SYMPTOMS_MIXED_NO_TESTS',
            9: 'NERD_MIXED'
        }
        
        block = scenario_to_block.get(scenario)
        if block:
            return block_to_phenotype.get(block, 'UNDETERMINED')
        
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
        
        # Logging para debug
        print(f"""
        🔍 Clasificación para usuario {user.username}:
        - GERDq+: {gerdq_positive}
        - RSI+: {rsi_positive}
        - Endoscopia realizada: {endoscopy_done}
        - Endoscopia positiva: {endoscopy_positive}
        - pH realizada: {ph_done}
        - pH positiva: {ph_positive}
        - pH negativa: {ph_negative}
        """)
        
        # Determinar escenario
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive, rsi_positive, 
            endoscopy_done, endoscopy_positive,
            ph_done, ph_positive, ph_negative
        )
        
        # Determinar fenotipo
        phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
        
        print(f"✅ Escenario: {scenario} → Fenotipo: {phenotype}")
        
        # Actualizar perfil
        profile.scenario = scenario
        profile.phenotype = phenotype
        profile.save()
        
        return {
            'scenario': scenario,
            'phenotype': phenotype,
            'questionnaires': {
                'gerdq_positive': gerdq_positive,
                'rsi_positive': rsi_positive
            },
            'tests': {
                'endoscopy_done': endoscopy_done,
                'endoscopy_positive': endoscopy_positive,
                'ph_done': ph_done,
                'ph_positive': ph_positive,
                'ph_negative': ph_negative
            }
        }