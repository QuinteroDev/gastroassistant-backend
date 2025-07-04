from django.core.management.base import BaseCommand
from questionnaires.models import Questionnaire, Question, AnswerOption
from django.utils import timezone

class Command(BaseCommand):
    help = 'Crea los cuestionarios GERDq y RSI con sus preguntas y opciones'

    def handle(self, *args, **options):
        
        self.stdout.write('Eliminando cuestionarios existentes...')
        Questionnaire.objects.filter(type__in=['GERDQ', 'RSI']).delete()
        
        self.stdout.write('Creando cuestionario GERDq...')
        self.create_gerdq()
        
        self.stdout.write('Creando cuestionario RSI...')
        self.create_rsi()
        
        self.stdout.write(self.style.SUCCESS('¡Todos los cuestionarios creados con éxito!'))
    
    def create_gerdq(self):
        # Crear el cuestionario
        gerdq, created = Questionnaire.objects.get_or_create(
            pk=1,
            defaults={
                'name': 'GERDq',
                'title': 'Cuestionario GERDq',
                'type': 'GERDQ',
                'description': 'Cuestionario para evaluar síntomas de reflujo gastroesofágico',
                'created_at': timezone.now()
            }
        )
        
        status = 'creado' if created else 'ya existía'
        self.stdout.write(f'Cuestionario GERDq {status}')
        
        # Pregunta 1
        q1, q1_created = Question.objects.get_or_create(
            pk=1,
            defaults={
                'questionnaire': gerdq,
                'text': '¿Con qué frecuencia ha sentido una sensación de ardor o quemazón en el pecho (acidez)?',
                'order': 1
            }
        )
        
        if q1_created:
            options = [
                {'id': 1, 'text': '0 días', 'value': 0, 'order': 1},
                {'id': 2, 'text': '1 día', 'value': 1, 'order': 2},
                {'id': 3, 'text': '2-3 días', 'value': 2, 'order': 3},
                {'id': 4, 'text': '4-7 días', 'value': 3, 'order': 4}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q1,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 2
        q2, q2_created = Question.objects.get_or_create(
            pk=2,
            defaults={
                'questionnaire': gerdq,
                'text': '¿Con qué frecuencia ha sentido que el contenido del estómago le sube a la garganta o a la boca (regurgitación)?',
                'order': 2
            }
        )
        
        if q2_created:
            options = [
                {'id': 5, 'text': '0 días', 'value': 0, 'order': 1},
                {'id': 6, 'text': '1 día', 'value': 1, 'order': 2},
                {'id': 7, 'text': '2-3 días', 'value': 2, 'order': 3},
                {'id': 8, 'text': '4-7 días', 'value': 3, 'order': 4}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q2,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 3
        q3, q3_created = Question.objects.get_or_create(
            pk=3,
            defaults={
                'questionnaire': gerdq,
                'text': '¿Con qué frecuencia ha sentido dolor en la parte superior del estómago o pecho?',
                'order': 3
            }
        )
        
        if q3_created:
            options = [
                {'id': 9, 'text': '0 días', 'value': 3, 'order': 1},
                {'id': 10, 'text': '1 día', 'value': 2, 'order': 2},
                {'id': 11, 'text': '2-3 días', 'value': 1, 'order': 3},
                {'id': 12, 'text': '4-7 días', 'value': 0, 'order': 4}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q3,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 4
        q4, q4_created = Question.objects.get_or_create(
            pk=4,
            defaults={
                'questionnaire': gerdq,
                'text': '¿Con qué frecuencia ha sentido náuseas?',
                'order': 4
            }
        )
        
        if q4_created:
            options = [
                {'id': 13, 'text': '0 días', 'value': 3, 'order': 1},
                {'id': 14, 'text': '1 día', 'value': 2, 'order': 2},
                {'id': 15, 'text': '2-3 días', 'value': 1, 'order': 3},
                {'id': 16, 'text': '4-7 días', 'value': 0, 'order': 4}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q4,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        q5, q5_created = Question.objects.get_or_create(
            pk=5,  # ← CAMBIAR DE VUELTA A 5
            defaults={
                'questionnaire': gerdq,
                'text': '¿Con qué frecuencia ha tenido dificultad para dormir por la acidez o regurgitación?',
                'order': 5
            }
        )
        
        if q5_created:
            options = [
                {'id': 17, 'text': '0 días', 'value': 0, 'order': 1},
                {'id': 18, 'text': '1 día', 'value': 1, 'order': 2},
                {'id': 19, 'text': '2-3 días', 'value': 2, 'order': 3},
                {'id': 20, 'text': '4-7 días', 'value': 3, 'order': 4}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q5,  # ← CAMBIAR REFERENCIA A q5
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 6
        q6, q6_created = Question.objects.get_or_create(
            pk=6,
            defaults={
                'questionnaire': gerdq,
                'text': '¿Con qué frecuencia ha tomado medicación adicional para la acidez o regurgitación, aparte de la que le ha recetado su médico?',
                'order': 6
            }
        )
        
        if q6_created:
            options = [
                {'id': 21, 'text': '0 días', 'value': 0, 'order': 1},
                {'id': 22, 'text': '1 día', 'value': 1, 'order': 2},
                {'id': 23, 'text': '2-3 días', 'value': 2, 'order': 3},
                {'id': 24, 'text': '4-7 días', 'value': 3, 'order': 4}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q6,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        self.stdout.write(self.style.SUCCESS('Cuestionario GERDq completado con éxito'))

    def create_rsi(self):
        # Crear el cuestionario
        rsi, created = Questionnaire.objects.get_or_create(
            pk=2,
            defaults={
                'name': 'RSI',
                'title': 'Índice de Síntomas de Reflujo (RSI)',
                'type': 'RSI',
                'description': 'Cuestionario para evaluar síntomas extraesofágicos de reflujo',
                'created_at': timezone.now()
            }
        )
        
        status = 'creado' if created else 'ya existía'
        self.stdout.write(f'Cuestionario RSI {status}')
        
        # Pregunta 1
        q1, q1_created = Question.objects.get_or_create(
            pk=7,
            defaults={
                'questionnaire': rsi,
                'text': 'Afonía u otros cambios de la voz',
                'order': 1
            }
        )
        
        if q1_created:
            options = [
                {'id': 25, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 26, 'text': '1', 'value': 1, 'order': 2},
                {'id': 27, 'text': '2', 'value': 2, 'order': 3},
                {'id': 28, 'text': '3', 'value': 3, 'order': 4},
                {'id': 29, 'text': '4', 'value': 4, 'order': 5},
                {'id': 30, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q1,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 2
        q2, q2_created = Question.objects.get_or_create(
            pk=8,
            defaults={
                'questionnaire': rsi,
                'text': 'Carraspeo o necesidad de aclarar la garganta',
                'order': 2
            }
        )
        
        if q2_created:
            options = [
                {'id': 31, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 32, 'text': '1', 'value': 1, 'order': 2},
                {'id': 33, 'text': '2', 'value': 2, 'order': 3},
                {'id': 34, 'text': '3', 'value': 3, 'order': 4},
                {'id': 35, 'text': '4', 'value': 4, 'order': 5},
                {'id': 36, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q2,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 3
        q3, q3_created = Question.objects.get_or_create(
            pk=9,
            defaults={
                'questionnaire': rsi,
                'text': 'Sensación de tragar moco que cae por detrás de la nariz.',
                'order': 3
            }
        )
        
        if q3_created:
            options = [
                {'id': 37, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 38, 'text': '1', 'value': 1, 'order': 2},
                {'id': 39, 'text': '2', 'value': 2, 'order': 3},
                {'id': 40, 'text': '3', 'value': 3, 'order': 4},
                {'id': 41, 'text': '4', 'value': 4, 'order': 5},
                {'id': 42, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q3,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 4
        q4, q4_created = Question.objects.get_or_create(
            pk=10,
            defaults={
                'questionnaire': rsi,
                'text': 'Dificultad para tragar comida, líquidos o pastillas',
                'order': 4
            }
        )
        
        if q4_created:
            options = [
                {'id': 43, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 44, 'text': '1', 'value': 1, 'order': 2},
                {'id': 45, 'text': '2', 'value': 2, 'order': 3},
                {'id': 46, 'text': '3', 'value': 3, 'order': 4},
                {'id': 47, 'text': '4', 'value': 4, 'order': 5},
                {'id': 48, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q4,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 5
        q5, q5_created = Question.objects.get_or_create(
            pk=11,
            defaults={
                'questionnaire': rsi,
                'text': 'Tos después de comer o tras estar tumbado',
                'order': 5
            }
        )
        
        if q5_created:
            options = [
                {'id': 49, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 50, 'text': '1', 'value': 1, 'order': 2},
                {'id': 51, 'text': '2', 'value': 2, 'order': 3},
                {'id': 52, 'text': '3', 'value': 3, 'order': 4},
                {'id': 53, 'text': '4', 'value': 4, 'order': 5},
                {'id': 54, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q5,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 6
        q6, q6_created = Question.objects.get_or_create(
            pk=12,
            defaults={
                'questionnaire': rsi,
                'text': 'Dificultad para respirar o episodios de atragantamiento/ahogo',
                'order': 6
            }
        )
        
        if q6_created:
            options = [
                {'id': 55, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 56, 'text': '1', 'value': 1, 'order': 2},
                {'id': 57, 'text': '2', 'value': 2, 'order': 3},
                {'id': 58, 'text': '3', 'value': 3, 'order': 4},
                {'id': 59, 'text': '4', 'value': 4, 'order': 5},
                {'id': 60, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q6,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 7
        q7, q7_created = Question.objects.get_or_create(
            pk=13,
            defaults={
                'questionnaire': rsi,
                'text': 'Ataques de tos',
                'order': 7
            }
        )
        
        if q7_created:
            options = [
                {'id': 61, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 62, 'text': '1', 'value': 1, 'order': 2},
                {'id': 63, 'text': '2', 'value': 2, 'order': 3},
                {'id': 64, 'text': '3', 'value': 3, 'order': 4},
                {'id': 65, 'text': '4', 'value': 4, 'order': 5},
                {'id': 66, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q7,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 8
        q8, q8_created = Question.objects.get_or_create(
            pk=14,
            defaults={
                'questionnaire': rsi,
                'text': 'Sensación de bulto o de tener algo pegado en la garganta. Sensación de tener algo a medio tragar',
                'order': 8
            }
        )
        
        if q8_created:
            options = [
                {'id': 67, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 68, 'text': '1', 'value': 1, 'order': 2},
                {'id': 69, 'text': '2', 'value': 2, 'order': 3},
                {'id': 70, 'text': '3', 'value': 3, 'order': 4},
                {'id': 71, 'text': '4', 'value': 4, 'order': 5},
                {'id': 72, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q8,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        # Pregunta 9
        q9, q9_created = Question.objects.get_or_create(
            pk=15,
            defaults={
                'questionnaire': rsi,
                'text': 'Sensación de que el ácido del estómago sube a la garganta. Quemazón u opresión en el pecho.',
                'order': 9
            }
        )
        
        if q9_created:
            options = [
                {'id': 73, 'text': '0 - No problema', 'value': 0, 'order': 1},
                {'id': 74, 'text': '1', 'value': 1, 'order': 2},
                {'id': 75, 'text': '2', 'value': 2, 'order': 3},
                {'id': 76, 'text': '3', 'value': 3, 'order': 4},
                {'id': 77, 'text': '4', 'value': 4, 'order': 5},
                {'id': 78, 'text': '5 - Problema severo', 'value': 5, 'order': 6}
            ]
            for opt in options:
                AnswerOption.objects.get_or_create(
                    pk=opt['id'],
                    defaults={
                        'question': q9,
                        'text': opt['text'],
                        'value': opt['value'],
                        'order': opt['order']
                    }
                )
        
        self.stdout.write(self.style.SUCCESS('Cuestionario RSI completado con éxito'))