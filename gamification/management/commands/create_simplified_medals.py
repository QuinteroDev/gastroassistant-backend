# gamification/management/commands/create_simplified_medals_fixed.py

from django.core.management.base import BaseCommand
from gamification.models import Medal

class Command(BaseCommand):
    help = 'Crea medallas corregidas (puntos por ciclo individual, no acumulativo)'

    def handle(self, *args, **options):
        # Eliminar medallas existentes
        Medal.objects.all().delete()
        self.stdout.write('🧹 Medallas anteriores eliminadas')

        # CORREGIDO: Medallas por mes (ciclo) con nombres correctos
        fixed_medals = [
            {
                'name': 'Mes 1',
                'description': '¡Has completado tu primer mes con éxito! 🎉',
                'icon': '🥉',
                'required_points': 1600,  # Al completar ciclo 1
                'required_level': 'BRONCE',
                'required_cycle_number': 1,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Mes 2', 
                'description': '¡Segundo mes completado! Tu constancia es admirable.',
                'icon': '🥈',
                'required_points': 1600,  # CORREGIDO: 1600 para ciclo 2
                'required_level': 'PLATA',
                'required_cycle_number': 2,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Mes 3',
                'description': '¡Tercer mes dominado! Has dominado el arte del cuidado.',
                'icon': '🥇',
                'required_points': 1600,  # CORREGIDO: 1600 para ciclo 3
                'required_level': 'ORO',
                'required_cycle_number': 3,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Mes 4',
                'description': '¡Cuarto mes perfecto! Tu dedicación es ejemplar.',
                'icon': '💎',
                'required_points': 1600,  # CORREGIDO: 1600 para ciclo 4
                'required_level': 'PLATINO',
                'required_cycle_number': 4,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Mes 5',
                'description': '¡Quinto mes completado! Solo los más dedicados llegan aquí.',
                'icon': '👑',
                'required_points': 1600,  # CORREGIDO: 1600 para ciclo 5
                'required_level': 'MAESTRO',
                'required_cycle_number': 5,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Mes 6',
                'description': '¡Sexto mes magistral! Eres un ejemplo de excelencia.',
                'icon': '⭐',
                'required_points': 1600,  # CORREGIDO: 1600 para ciclo 6
                'required_level': 'MAESTRO',
                'required_cycle_number': 6,
                'week_number': 4,
                'order': 2
            }
        ]

        for medal_data in fixed_medals:
            Medal.objects.create(**medal_data)
            self.stdout.write(f'✅ Creada: {medal_data["icon"]} {medal_data["name"]} ({medal_data["required_points"]} pts, ciclo {medal_data["required_cycle_number"]})')

        self.stdout.write(
            self.style.SUCCESS(f'🎉 {len(fixed_medals)} medallas corregidas creadas')
        )

        # Mostrar explicación
        self.stdout.write('\n📋 EXPLICACIÓN:')
        self.stdout.write('• Cada medalla se otorga al completar 1600 puntos en su ciclo específico')
        self.stdout.write('• Los puntos se resetean cada ciclo, por eso todas necesitan 1600 pts')
        self.stdout.write('• El nivel y ciclo determinan cuándo se puede obtener cada medalla')
        self.stdout.write('')