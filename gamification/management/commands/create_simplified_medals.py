from django.core.management.base import BaseCommand
from gamification.models import Medal

class Command(BaseCommand):
    help = 'Crea las 6 medallas simplificadas (1 por nivel)'

    def handle(self, *args, **options):
        # Eliminar medallas existentes
        Medal.objects.all().delete()
        self.stdout.write('🧹 Medallas anteriores eliminadas')

        # Crear 1 medalla por nivel (6 total)
        simplified_medals = [
            {
                'name': 'Defensor de Hábitos',
                'description': '¡Has subido a Bronce! Primeros pasos en el cuidado digestivo completados.',
                'icon': '🥉',
                'required_points': 1600,
                'required_level': 'BRONCE',
                'required_cycle_number': 1,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Guardián del Bienestar',
                'description': '¡Has alcanzado el nivel Plata! Tu constancia es admirable.',
                'icon': '🥈',
                'required_points': 2400,
                'required_level': 'PLATA',
                'required_cycle_number': 2,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Maestro de la Salud',
                'description': '¡Nivel Oro conseguido! Has dominado el arte del cuidado digestivo.',
                'icon': '🥇',
                'required_points': 3200,
                'required_level': 'ORO',
                'required_cycle_number': 3,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Campeón del Equilibrio',
                'description': '¡Nivel Platino alcanzado! Tu dedicación es ejemplar.',
                'icon': '💎',
                'required_points': 4000,
                'required_level': 'PLATINO',
                'required_cycle_number': 4,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Leyenda de la Constancia',
                'description': '¡Has llegado a Maestro! Solo los más dedicados alcanzan este nivel.',
                'icon': '👑',
                'required_points': 4800,
                'required_level': 'MAESTRO',
                'required_cycle_number': 5,
                'week_number': 4,
                'order': 1
            },
            {
                'name': 'Élite Digestiva',
                'description': '¡Maestro Supremo! Eres un ejemplo de excelencia en salud digestiva.',
                'icon': '⭐',
                'required_points': 5500,
                'required_level': 'MAESTRO',
                'required_cycle_number': 6,
                'week_number': 4,
                'order': 2
            }
        ]

        for medal_data in simplified_medals:
            Medal.objects.create(**medal_data)
            self.stdout.write(f'✅ Creada: {medal_data["icon"]} {medal_data["name"]}')

        self.stdout.write(
            self.style.SUCCESS(f'🎉 {len(simplified_medals)} medallas simplificadas creadas')
        )
