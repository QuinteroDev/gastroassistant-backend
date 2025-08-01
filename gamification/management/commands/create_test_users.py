# profiles/management/commands/create_test_users.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from profiles.models import UserProfile
from questionnaires.models import (
    Questionnaire, Question, AnswerOption, UserAnswer, 
    QuestionnaireCompletion, HabitQuestion, HabitOption, UserHabitAnswer
)
from profiles.services import PhenotypeClassificationService
from programs.services import ProgramAssignmentService
from recommendations.services import RecommendationService, HabitTrackingService
import random

class Command(BaseCommand):
    help = 'Crea usuarios de prueba para todos los escenarios A-R con datos completos'

    def handle(self, *args, **kwargs):
        self.stdout.write('🚀 Creando usuarios de prueba para todos los escenarios...\n')
        
        # Obtener cuestionarios
        try:
            gerdq = Questionnaire.objects.get(type='GERDQ')
            rsi = Questionnaire.objects.get(type='RSI')
            habits = Questionnaire.objects.get(type='HABITS')
            clinical = Questionnaire.objects.get(name='Clinical_Factors_v1')
        except Questionnaire.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
            self.stdout.write('Asegúrate de haber ejecutado los comandos de inicialización de cuestionarios.')
            return
        
        # Definir todos los escenarios con sus características
        scenarios_config = [
            # (scenario, has_endo, endo_result, has_ph, ph_result, gerdq_positive, rsi_positive)
            ('A', True, 'ESOPHAGITIS_A', False, None, False, False),     # Erosiva sin síntomas
            ('B', True, 'NORMAL', True, 'POSITIVE', True, True),         # NERD Mixto
            ('C', True, 'NORMAL', True, 'POSITIVE', True, False),        # NERD
            ('D', True, 'NORMAL', True, 'POSITIVE', False, True),        # Extraesofágico
            ('E', True, 'NORMAL', True, 'POSITIVE', False, False),       # Bienestar con pH+
            ('F', True, 'NORMAL', True, 'NEGATIVE', True, True),         # Funcional mixto
            ('F2', True, 'NORMAL', True, 'NEGATIVE', True, False),       # Funcional digestivo
            ('F3', True, 'NORMAL', True, 'NEGATIVE', False, True),       # Funcional extraesofágico
            ('F4', True, 'NORMAL', True, 'NEGATIVE', False, False),      # Bienestar con pruebas negativas
            ('G', True, 'NORMAL', False, None, True, True),              # Mixto sin pH
            ('H', True, 'NORMAL', False, None, True, False),             # Digestivo sin pH
            ('I', True, 'NORMAL', False, None, False, True),             # Extraesofágico sin pH
            ('J', True, 'NORMAL', False, None, False, False),            # Bienestar sin pH
            ('K', False, None, True, 'POSITIVE', True, True),            # Mixto sin endoscopia
            ('L', False, None, True, 'POSITIVE', True, False),           # Digestivo sin endoscopia
            ('M', False, None, True, 'POSITIVE', False, True),           # Extraesofágico sin endoscopia
            ('N', False, None, True, 'POSITIVE', False, False),          # Bienestar sin endoscopia
            ('O', False, None, False, None, True, True),                 # Mixto sin pruebas
            ('P', False, None, False, None, True, False),                # Digestivo sin pruebas
            ('Q', False, None, False, None, False, True),                # Extraesofágico sin pruebas
            ('R', False, None, False, None, False, False),               # Bienestar sin pruebas
        ]
        
        created_users = []
        
        for config in scenarios_config:
            scenario_code = config[0]
            has_endoscopy = config[1]
            endoscopy_result = config[2]
            has_ph = config[3]
            ph_result = config[4]
            gerdq_positive = config[5]
            rsi_positive = config[6]
            
            username = f'test_scenario_{scenario_code.lower()}'
            
            self.stdout.write(f'\n📋 Creando usuario para escenario {scenario_code}...')
            
            with transaction.atomic():
                # Eliminar usuario existente si existe
                User.objects.filter(username=username).delete()
                
                # Crear nuevo usuario
                user = User.objects.create_user(
                    username=username,
                    email=f'{username}@gastroassistant.test',
                    password='test123456',
                    first_name=f'Test_{scenario_code}'
                )
                
                # Actualizar perfil básico
                profile = user.profile
                profile.weight_kg = round(random.uniform(60, 90), 1)
                profile.height_cm = round(random.uniform(160, 185), 1)
                profile.avatar = random.choice(['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5'])
                
                # Configurar pruebas diagnósticas
                profile.has_endoscopy = has_endoscopy
                if has_endoscopy:
                    profile.endoscopy_result = endoscopy_result or 'NORMAL'
                else:
                    profile.endoscopy_result = 'NOT_DONE'
                
                profile.has_ph_monitoring = has_ph
                if has_ph:
                    profile.ph_monitoring_result = ph_result or 'NOT_DONE'
                else:
                    profile.ph_monitoring_result = 'NOT_DONE'
                
                # Agregar algunos factores clínicos aleatorios
                if random.choice([True, False]):
                    profile.has_hernia = 'YES'
                if random.choice([True, False]):
                    profile.has_gastritis = 'YES'
                if random.choice([True, False]):
                    profile.stress_affects = 'YES'
                if scenario_code in ['A', 'B', 'C']:  # Mayor probabilidad de H.pylori en erosivos
                    if random.random() < 0.3:
                        profile.h_pylori_status = 'ACTIVE'
                
                profile.save()
                
                # Crear respuestas para GERDq
                self._create_questionnaire_answers(
                    user, gerdq, 
                    target_positive=gerdq_positive,
                    questionnaire_type='GERDQ'
                )
                
                # Crear respuestas para RSI
                self._create_questionnaire_answers(
                    user, rsi,
                    target_positive=rsi_positive,
                    questionnaire_type='RSI'
                )
                
                # Crear respuestas para hábitos
                self._create_habit_answers(user)
                
                # Crear respuestas para factores clínicos
                self._create_clinical_answers(user, clinical)
                
                # Marcar onboarding como completo
                profile.onboarding_complete = True
                profile.save()
                
                # Clasificar usuario
                classification = PhenotypeClassificationService.classify_user(user)
                
                # Asignar programa
                user_program = ProgramAssignmentService.assign_program(user)
                
                # Generar recomendaciones
                recommendations = RecommendationService.generate_recommendations_for_user(user)
                prioritized = RecommendationService.prioritize_recommendations(user)
                
                # Configurar tracking de hábitos
                trackers, promoted = HabitTrackingService.setup_habit_tracking(user)
                
                # 🆕 CREAR PRIMER CICLO Y COMPLETAR SU ONBOARDING
                from cycles.services import CycleService
                
                # Crear el primer ciclo
                first_cycle = CycleService.create_new_cycle(user, is_first_cycle=True)
                
                # Obtener los scores de los cuestionarios
                gerdq_completion = QuestionnaireCompletion.objects.filter(
                    user=user,
                    questionnaire__type='GERDQ'
                ).first()
                
                rsi_completion = QuestionnaireCompletion.objects.filter(
                    user=user,
                    questionnaire__type='RSI'
                ).first()
                
                # Completar el onboarding del ciclo
                CycleService.complete_cycle_onboarding(
                    cycle=first_cycle,
                    gerdq_score=gerdq_completion.score if gerdq_completion else 0,
                    rsi_score=rsi_completion.score if rsi_completion else 0,
                    phenotype=classification['phenotype'],
                    program=user_program.program if user_program else None
                )
                
                self.stdout.write(f'  └─ Ciclo 1 creado y configurado')
                
                created_users.append({
                    'username': username,
                    'scenario': classification['scenario'],
                    'phenotype': classification['phenotype'],
                    'program': user_program.program.name if user_program else 'Sin programa',
                    'gerdq': gerdq_positive,
                    'rsi': rsi_positive,
                    'endoscopy': has_endoscopy,
                    'ph': has_ph,
                    'cycle': first_cycle.cycle_number
                })
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Usuario {username} creado exitosamente'
                    )
                )
        
        # Mostrar resumen
        self._print_summary(created_users)
    
    def _create_questionnaire_answers(self, user, questionnaire, target_positive, questionnaire_type):
        """Crea respuestas para GERDq o RSI para lograr el score deseado."""
        questions = questionnaire.questions.all().order_by('order')
        total_score = 0
        answers_to_create = []
        
        for question in questions:
            options = list(question.options.all().order_by('value'))
            
            if target_positive:
                # Para GERDq: score ≥ 8 es positivo
                # Para RSI: score ≥ 13 es positivo
                if questionnaire_type == 'GERDQ':
                    # Seleccionar opciones de valor medio-alto
                    selected_option = random.choice([opt for opt in options if opt.value >= 1])
                else:  # RSI
                    # Seleccionar opciones de valor medio-alto
                    selected_option = random.choice([opt for opt in options if opt.value >= 2])
            else:
                # Seleccionar opciones de valor bajo
                selected_option = options[0] if options else None
            
            if selected_option:
                answers_to_create.append(
                    UserAnswer(
                        user=user,
                        question=question,
                        selected_option=selected_option
                    )
                )
                total_score += selected_option.value
        
        # Crear todas las respuestas
        UserAnswer.objects.bulk_create(answers_to_create)
        
        # Crear completion
        QuestionnaireCompletion.objects.create(
            user=user,
            questionnaire=questionnaire,
            score=total_score,
            is_onboarding=True
        )
        
        print(f"  └─ {questionnaire_type}: Score {total_score} ({'Positivo' if target_positive else 'Negativo'})")
    
    def _create_habit_answers(self, user):
        """Crea respuestas aleatorias para el cuestionario de hábitos."""
        habit_questions = HabitQuestion.objects.all()
        
        for question in habit_questions:
            options = list(question.options.all().order_by('value'))
            
            # Dar más peso a hábitos malos (valores bajos) para tener algo que mejorar
            weights = [0.4, 0.3, 0.2, 0.1] if len(options) == 4 else None
            selected_option = random.choices(options, weights=weights)[0] if weights else random.choice(options)
            
            UserHabitAnswer.objects.create(
                user=user,
                question=question,
                selected_option=selected_option,
                is_onboarding=True
            )
        
        # Crear completion para hábitos
        try:
            habits_questionnaire = Questionnaire.objects.get(type='HABITS')
            QuestionnaireCompletion.objects.create(
                user=user,
                questionnaire=habits_questionnaire,
                score=None,
                is_onboarding=True
            )
        except:
            pass
    
    def _create_clinical_answers(self, user, clinical_questionnaire):
        """Crea respuestas para factores clínicos basadas en el perfil."""
        profile = user.profile
        questions = clinical_questionnaire.questions.all().order_by('order')
        
        # Mapeo de campos del perfil a respuestas
        field_to_value = {
            1: 1 if profile.has_hernia == 'YES' else 0,           # Hernia
            2: 1 if profile.has_gastritis == 'YES' else 0,        # Gastritis
            3: 3 if profile.h_pylori_status == 'ACTIVE' else 0,   # H.pylori
            4: 1 if profile.has_altered_motility == 'YES' else 0, # Motilidad
            5: 1 if profile.has_slow_emptying == 'YES' else 0,    # Vaciamiento
            6: 1 if profile.has_dry_mouth == 'YES' else 0,        # Sequedad
            7: 1 if profile.has_constipation == 'YES' else 0,     # Estreñimiento
            8: 2 if profile.stress_affects == 'YES' else 0,       # Estrés
            9: random.choice([0, 1]),                              # Intestinal (aleatorio)
        }
        
        answers_to_create = []
        
        for question in questions:
            target_value = field_to_value.get(question.order, 0)
            
            # Buscar la opción con el valor más cercano al target
            options = question.options.all()
            selected_option = min(options, key=lambda x: abs(x.value - target_value))
            
            answers_to_create.append(
                UserAnswer(
                    user=user,
                    question=question,
                    selected_option=selected_option
                )
            )
        
        UserAnswer.objects.bulk_create(answers_to_create)
        
        # Crear completion
        QuestionnaireCompletion.objects.create(
            user=user,
            questionnaire=clinical_questionnaire,
            score=None,
            is_onboarding=True
        )
    
    def _print_summary(self, created_users):
        """Imprime un resumen detallado de los usuarios creados."""
        self.stdout.write('\n' + '='*100)
        self.stdout.write(self.style.SUCCESS(f'\n✨ {len(created_users)} usuarios de prueba creados exitosamente!\n'))
        
        # Tabla de resumen
        self.stdout.write('📊 Resumen de usuarios creados:\n')
        self.stdout.write('-'*100)
        self.stdout.write(
            f'{"Usuario":<25} {"Esc":<4} {"Fenotipo":<25} {"Programa":<20} '
            f'{"GERDq":<7} {"RSI":<7} {"Endo":<6} {"pH":<6} {"Ciclo":<6}'
        )
        self.stdout.write('-'*100)
        
        for user_data in created_users:
            self.stdout.write(
                f'{user_data["username"]:<25} '
                f'{user_data["scenario"]:<4} '
                f'{user_data["phenotype"]:<25} '
                f'{user_data["program"]:<20} '
                f'{"✓" if user_data["gerdq"] else "✗":<7} '
                f'{"✓" if user_data["rsi"] else "✗":<7} '
                f'{"✓" if user_data["endoscopy"] else "✗":<6} '
                f'{"✓" if user_data["ph"] else "✗":<6} '
                f'{user_data.get("cycle", 1):<6}'
            )
        
        self.stdout.write('-'*100)
        
        # Instrucciones de uso
        self.stdout.write('\n📝 Instrucciones de uso:')
        self.stdout.write('─────────────────────')
        self.stdout.write('• Todos los usuarios tienen la contraseña: test123456')
        self.stdout.write('• Formato de usuario: test_scenario_[letra]')
        self.stdout.write('• Emails: test_scenario_[letra]@gastroassistant.test')
        
        # Explicación de escenarios
        self.stdout.write('\n🎯 Explicación de escenarios:')
        self.stdout.write('────────────────────────────')
        self.stdout.write('• Escenario A: ERGE Erosiva (endoscopia positiva)')
        self.stdout.write('• Escenarios B-E: Variantes con pH-metría positiva')
        self.stdout.write('• Escenarios F-F4: pH-metría negativa (funcional)')
        self.stdout.write('• Escenarios G-J: Solo endoscopia realizada')
        self.stdout.write('• Escenarios K-N: Solo pH-metría realizada')
        self.stdout.write('• Escenarios O-R: Sin pruebas diagnósticas')
        
        # Leyenda
        self.stdout.write('\n📌 Leyenda:')
        self.stdout.write('──────────')
        self.stdout.write('• GERDq+: Score ≥ 8 (síntomas digestivos)')
        self.stdout.write('• RSI+: Score ≥ 13 (síntomas extraesofágicos)')
        self.stdout.write('• ✓: Positivo/Realizado')
        self.stdout.write('• ✗: Negativo/No realizado')
        
        self.stdout.write('\n✅ ¡Listo para probar todos los escenarios!\n')