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
        Determina el tipo de programa basado en el escenario del usuario.
        Actualizado para manejar todos los escenarios A-R.
        """
        scenario = user_profile.scenario
        
        # Mapeo de escenarios a tipos de programa
        scenario_to_program = {
            # Programa A - ERGE Erosiva
            'A': 'A',
            
            # Programa B - NERD y variantes
            'B': 'B',  # NERD Mixto
            'C': 'B',  # NERD
            'E': 'B',  # Bienestar (pero con pH+) - Cambio según nueva lógica
            
            # Programa C - Extraesofágico
            'D': 'C',  # Extraesofágico con pH+
            
            # Programa D - El resto (Funcional, Sin pruebas, Bienestar)
            'F': 'D',   # Funcional
            'F2': 'D',  # Funcional
            'F3': 'D',  # Funcional
            'F4': 'D',  # Bienestar (con pruebas negativas)
            'G': 'D',   # Mixto sin pH
            'H': 'D',   # Digestivo sin pH
            'I': 'D',   # Extraesofágico sin pH
            'J': 'D',   # Bienestar sin pH
            'K': 'D',   # Mixto sin Endo
            'L': 'D',   # Digestivo sin Endo
            'M': 'D',   # Extraesofágico sin Endo
            'N': 'D',   # Bienestar sin Endo
            'O': 'D',   # Mixto sin pruebas
            'P': 'D',   # Digestivo sin pruebas
            'Q': 'D',   # Extraesofágico sin pruebas
            'R': 'D',   # Bienestar sin pruebas
        }
        
        # Obtener el tipo de programa del mapeo
        program_type = scenario_to_program.get(scenario)
        
        # Log para debugging
        print(f"🔍 Asignación de programa: Escenario {scenario} → Programa tipo {program_type}")
        
        return program_type
    
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
            print(f"❌ No se pudo determinar fenotipo para {user.username}")
            return None
        
        # Determinar el tipo de programa basado en el escenario
        program_type = ProgramAssignmentService.determine_program_type(user.profile)
        
        if not program_type:
            print(f"❌ No se pudo determinar tipo de programa para escenario {user.profile.scenario}")
            return None
        
        # Obtener el programa activo de ese tipo
        program = TreatmentProgram.objects.filter(type=program_type, is_active=True).first()
        
        # Si no hay programa disponible para ese tipo, devolver None
        if not program:
            print(f"❌ No hay programa activo de tipo {program_type}")
            return None
        
        # Asignar o actualizar el programa del usuario
        user_program, created = UserProgram.objects.update_or_create(
            user=user,
            defaults={'program': program}
        )
        
        action = "creado" if created else "actualizado"
        print(f"✅ Programa {action} para {user.username}: {program.name}")
        
        return user_program