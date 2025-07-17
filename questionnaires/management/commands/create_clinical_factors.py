# questionnaires/management/commands/create_clinical_factors.py
from django.core.management.base import BaseCommand
from django.db import transaction
from questionnaires.models import Questionnaire, Question, AnswerOption


class Command(BaseCommand):
    help = 'Creates Clinical Factors questionnaire with 11 questions'

    @transaction.atomic
    def handle(self, *args, **options):
        # Crear o obtener el cuestionario de factores clínicos
        questionnaire, created = Questionnaire.objects.get_or_create(
            name='Clinical_Factors_v1',
            defaults={
                'title': 'Factores Clínicos Asociados al Reflujo',
                'type': 'CLINICAL',
                'description': 'Cuestionario de factores clínicos asociados al reflujo basado en la Guía de ERGE 2019'
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Created questionnaire: {questionnaire.title}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️ Questionnaire already exists: {questionnaire.title}')
            )
            
            # Verificar si ya tiene preguntas
            if questionnaire.questions.exists():
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Questionnaire already has {questionnaire.questions.count()} questions. Skipping creation.')
                )
                return
            else:
                self.stdout.write(self.style.WARNING('📝 No questions found, creating them...'))

        # Definir las 11 preguntas con sus opciones
        questions_data = [
            {
                'order': 1,
                'text': '¿Te han dicho que tienes una hernia de hiato o una válvula de cierre del estómago débil (cardias incompetente)?',
                'field_mapping': 'has_hernia',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'No', 'value': 0, 'order': 2},
                    {'text': 'No lo sé', 'value': 2, 'order': 3}
                ]
            },
            {
                'order': 2,
                'text': '¿Te han dicho en alguna gastroscopia que tienes gastritis o inflamación en el estómago?',
                'field_mapping': 'has_gastritis',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'No', 'value': 0, 'order': 2},
                    {'text': 'No lo sé', 'value': 2, 'order': 3}
                ]
            },
            {
                'order': 3,
                'text': '¿Has tenido infección por Helicobacter pylori?',
                'field_mapping': 'h_pylori_status',
                'options': [
                    {'text': 'Sí, actualmente activa', 'value': 3, 'order': 1},
                    {'text': 'Sí, pero ya tratada', 'value': 2, 'order': 2},
                    {'text': 'No', 'value': 0, 'order': 3},
                    {'text': 'No lo sé', 'value': 1, 'order': 4}
                ]
            },
            {
                'order': 4,
                'text': '¿Te han detectado alguna alteración en el movimiento del esófago (por ejemplo, en una manometría o prueba funcional)?',
                'field_mapping': 'has_altered_motility',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'No', 'value': 0, 'order': 2},
                    {'text': 'No lo sé', 'value': 2, 'order': 3}
                ]
            },
            {
                'order': 5,
                'text': '¿Te han dicho que tu estómago vacía más lento de lo normal (gastroparesia)?',
                'field_mapping': 'has_slow_emptying',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'No', 'value': 0, 'order': 2},
                    {'text': 'No lo sé', 'value': 2, 'order': 3}
                ]
            },
            {
                'order': 6,
                'text': '¿Tienes sequedad de boca frecuente o te han comentado que produces poca saliva?',
                'field_mapping': 'has_dry_mouth',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'No', 'value': 0, 'order': 2},
                    {'text': 'No lo sé', 'value': 2, 'order': 3}
                ]
            },
            {
                'order': 7,
                'text': '¿Sueles tener estreñimiento o necesitas hacer mucho esfuerzo al ir al baño?',
                'field_mapping': 'has_constipation',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'A veces', 'value': 2, 'order': 2},
                    {'text': 'No', 'value': 0, 'order': 3}
                ]
            },
            {
                'order': 8,
                'text': '¿Sientes que el estrés o la ansiedad empeoran claramente tus síntomas digestivos?',
                'field_mapping': 'stress_affects',
                'options': [
                    {'text': 'Sí, claramente', 'value': 2, 'order': 1},
                    {'text': 'A veces', 'value': 1, 'order': 2},
                    {'text': 'No', 'value': 0, 'order': 3}
                ]
            },
            {
                'order': 9,
                'text': '¿Te han diagnosticado alguna alteración digestiva como SIBO, disbiosis intestinal, colon irritable (SII) u otra condición funcional digestiva, o presentas muchos gases frecuentemente?',
                'field_mapping': 'has_intestinal_disorders',
                'options': [
                    {'text': 'Sí', 'value': 1, 'order': 1},
                    {'text': 'No', 'value': 0, 'order': 2},
                    {'text': 'No lo sé', 'value': 2, 'order': 3}
                ]
            },
        ]

        # Crear las preguntas empezando desde ID 100 para evitar conflictos
        questions_created = 0
        base_question_id = 100
        
        for question_data in questions_data:
            # Crear pregunta con ID específico
            question = Question(
                id=base_question_id + question_data['order'] - 1,
                questionnaire=questionnaire,
                text=question_data['text'],
                order=question_data['order']
            )
            question.save()
            
            # Crear las opciones para cada pregunta empezando desde ID 200
            options_created = 0
            base_option_id = 200 + (question_data['order'] - 1) * 10  # 200, 210, 220, etc.
            
            for option_index, option_data in enumerate(question_data['options']):
                option = AnswerOption(
                    id=base_option_id + option_index,
                    question=question,
                    text=option_data['text'],
                    value=option_data['value'],
                    order=option_data['order']
                )
                option.save()
                options_created += 1
            
            questions_created += 1
            self.stdout.write(
                self.style.SUCCESS(f'  ✅ Question {question.order}: {options_created} options')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'🎉 Successfully created {questions_created} questions for Clinical Factors questionnaire'
            )
        )
        
        # Mostrar información sobre el mapeo de valores
        self.stdout.write(self.style.WARNING('\n📋 VALUE MAPPING REFERENCE:'))
        self.stdout.write('Questions 1,2,4,5,6,9 (YES/NO/UNKNOWN): Sí=1, No=0, No sé=2')
        self.stdout.write('Question 3 (H.pylori): Activa=3, Tratada=2, No sé=1, No=0')
        self.stdout.write('Question 7 (Constipation): Sí=1, A veces=2, No=0')
        self.stdout.write('Question 8 (Stress): Claramente=2, A veces=1, No=0')
        
        self.stdout.write(f'\n🆔 Questionnaire ID: {questionnaire.id}')
        self.stdout.write(f'📛 Questionnaire Name: {questionnaire.name}')