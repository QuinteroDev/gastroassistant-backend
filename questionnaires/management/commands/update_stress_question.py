# questionnaires/management/commands/update_stress_question.py
from django.core.management.base import BaseCommand
from django.db import transaction
from questionnaires.models import Question, AnswerOption

class Command(BaseCommand):
    help = 'Updates stress question option text from "Sí, claramente" to "Sí, mucho"'

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            # Buscar la pregunta 8 (stress) del cuestionario Clinical_Factors_v1
            question = Question.objects.filter(
                order=8, 
                questionnaire__name='Clinical_Factors_v1'
            ).first()
            
            if not question:
                self.stdout.write(
                    self.style.ERROR('❌ No se encontró la pregunta de estrés (orden 8)')
                )
                return
            
            self.stdout.write(
                self.style.WARNING(f'📋 Encontrada pregunta: "{question.text}"')
            )
            
            # Buscar la opción con value=2 (que es "Sí, claramente")
            option = question.options.filter(value=2).first()
            
            if not option:
                self.stdout.write(
                    self.style.ERROR('❌ No se encontró la opción "Sí, claramente"')
                )
                return
            
            # Mostrar el cambio
            old_text = option.text
            new_text = 'Sí, mucho'
            
            self.stdout.write(
                self.style.WARNING(f'🔄 Cambiando: "{old_text}" → "{new_text}"')
            )
            
            # Actualizar el texto
            option.text = new_text
            option.save()
            
            self.stdout.write(
                self.style.SUCCESS('✅ Opción actualizada exitosamente')
            )
            
            # Mostrar todas las opciones actuales
            self.stdout.write('\n📊 Opciones actuales para la pregunta de estrés:')
            for opt in question.options.all().order_by('order'):
                self.stdout.write(f'   - {opt.text} (valor: {opt.value})')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error al actualizar: {str(e)}')
            )