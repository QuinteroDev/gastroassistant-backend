# programs/services.py
from .models import TreatmentProgram, UserProgram
from questionnaires.models import QuestionnaireCompletion, Questionnaire
from profiles.services import PhenotypeClassificationService

class ProgramAssignmentService:
    """
    Servicio para asignar programas de tratamiento a usuarios
    basados en su clasificación fenotípica.
    """
    
    @staticmethod
    def get_latest_questionnaire_scores(user):
        """
        Obtiene los scores más recientes de los cuestionarios GerdQ y RSI de un usuario.
        """
        # Obtener el último resultado de GerdQ
        last_gerdq = QuestionnaireCompletion.objects.filter(
            user=user,
            questionnaire__type='GERDQ'
        ).order_by('-completed_at').first()
        
        # Obtener el último resultado de RSI
        last_rsi = QuestionnaireCompletion.objects.filter(
            user=user,
            questionnaire__type='RSI'
        ).order_by('-completed_at').first()
        
        gerdq_score = last_gerdq.score if last_gerdq else None
        rsi_score = last_rsi.score if last_rsi else None
        
        return gerdq_score, rsi_score
    
    @staticmethod
    def determine_program_type(user_profile):
        """
        Determina el tipo de programa basado en el fenotipo del usuario.
        Mapeo de Fenotipos a Programas:
        - EROSIVE -> 'A'
        - NERD -> 'B'
        - NERD_MIXED -> 'B' (usa el mismo programa base pero con contenido diferente)
        - EXTRAESOPHAGEAL -> 'C'
        - Otros (FUNCTIONAL, SYMPTOMS_NO_TESTS, etc.) -> 'D'
        """
        phenotype = user_profile.phenotype
        scenario = user_profile.scenario
        
        # Escenarios A, J -> EROSIVE -> Programa A
        if phenotype == 'EROSIVE' or scenario in ['A', 'J']:
            return 'A'
        
        # Escenarios B, K, M -> NERD y NERD_MIXED -> Programa B
        elif phenotype in ['NERD', 'NERD_MIXED'] or scenario in ['B', 'K', 'M']:
            return 'B'
        
        # Escenarios C, L -> EXTRAESOPHAGEAL -> Programa C
        elif phenotype == 'EXTRAESOPHAGEAL' or scenario in ['C', 'L']:
            return 'C'
        
        # Escenarios D, E, F, G, H, I -> Programa D
        else:
            return 'D'
        
    @staticmethod
    def assign_program(user):
        """
        Asigna un programa al usuario basado en su clasificación fenotípica.
        Si el usuario ya tiene un programa asignado, lo actualiza.
        """
        # Primero, realizar la clasificación fenotípica
        classification_result = PhenotypeClassificationService.classify_user(user)
        
        # Si no se pudo determinar un fenotipo, no asignar programa
        if classification_result['phenotype'] == 'UNDETERMINED':
            return None
        
        # Determinar el tipo de programa basado en el fenotipo
        program_type = ProgramAssignmentService.determine_program_type(user.profile)
        
        # Obtener el programa activo de ese tipo
        program = TreatmentProgram.objects.filter(type=program_type, is_active=True).first()
        
        # Si no hay programa disponible para ese tipo, devolver None
        if not program:
            return None
        
        # Asignar o actualizar el programa del usuario
        user_program, created = UserProgram.objects.update_or_create(
            user=user,
            defaults={'program': program}
        )
        
        return user_program