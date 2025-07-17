# Crear una migración de datos para poblar medallas
# python manage.py makemigrations --empty gamification

# Luego editar la migración con este contenido:
from django.db import migrations

def create_sample_medals(apps, schema_editor):
    """
    Crear medallas de ejemplo para los 6 ciclos
    """
    Medal = apps.get_model('gamification', 'Medal')
    
    # CICLO 1 - NOVATO 🟤
    medals_cycle_1 = [
        {
            'name': 'Defensor de Hábitos',
            'description': '¡Comenzaste tu viaje! Primeros pasos en el cuidado digestivo.',
            'icon': '🛡️',
            'required_points': 200,
            'required_level': 'NOVATO',
            'required_cycle_number': 1,
            'week_number': 1,
            'order': 1
        },
        {
            'name': 'Guardián de la Hidratación',
            'description': 'Mantuviste buenos hábitos de hidratación durante una semana.',
            'icon': '💧',
            'required_points': 600,
            'required_level': 'NOVATO',
            'required_cycle_number': 1,
            'week_number': 2,
            'order': 2
        },
        {
            'name': 'Maestro del Estrés',
            'description': 'Has empezado a manejar el estrés de forma consciente.',
            'icon': '🧘',
            'required_points': 1000,
            'required_level': 'NOVATO',
            'required_cycle_number': 1,
            'week_number': 3,
            'order': 3
        },
        {
            'name': 'Novato Completo',
            'description': '¡Completaste tu primer ciclo! Has establecido las bases.',
            'icon': '🟤',
            'required_points': 1500,
            'required_level': 'NOVATO',
            'required_cycle_number': 1,
            'week_number': 4,
            'order': 4
        }
    ]
    
    # CICLO 2 - BRONCE 🥉
    medals_cycle_2 = [
        {
            'name': 'Chef Supremo',
            'description': 'Dominas los horarios de comida y porciones adecuadas.',
            'icon': '👨‍🍳',
            'required_points': 400,
            'required_level': 'BRONCE',
            'required_cycle_number': 2,
            'week_number': 1,
            'order': 1
        },
        {
            'name': 'Hábitos Héroe',
            'description': 'Constancia ejemplar en el seguimiento de tus hábitos.',
            'icon': '🦸',
            'required_points': 800,
            'required_level': 'BRONCE',
            'required_cycle_number': 2,
            'week_number': 2,
            'order': 2
        },
        {
            'name': 'Master Masticación',
            'description': 'Has perfeccionado el arte de comer despacio y masticar bien.',
            'icon': '🍽️',
            'required_points': 1400,
            'required_level': 'BRONCE',
            'required_cycle_number': 2,
            'week_number': 3,
            'order': 3
        },
        {
            'name': 'Bronce Conquistado',
            'description': '¡Segundo ciclo completado! Tu constancia es admirable.',
            'icon': '🥉',
            'required_points': 2000,
            'required_level': 'BRONCE',
            'required_cycle_number': 2,
            'week_number': 4,
            'order': 4
        }
    ]
    
    # CICLO 3 - PLATA 🥈
    medals_cycle_3 = [
        {
            'name': 'Calm Estrés',
            'description': 'Has desarrollado técnicas avanzadas de manejo del estrés.',
            'icon': '🌸',
            'required_points': 600,
            'required_level': 'PLATA',
            'required_cycle_number': 3,
            'week_number': 1,
            'order': 1
        },
        {
            'name': 'Rey Hidratación',
            'description': 'Eres un maestro en la hidratación perfecta para tu digestión.',
            'icon': '👑',
            'required_points': 1200,
            'required_level': 'PLATA',
            'required_cycle_number': 3,
            'week_number': 2,
            'order': 2
        },
        {
            'name': 'Experto Sueño',
            'description': 'Has optimizado tus horarios nocturnos y síntomas.',
            'icon': '😴',
            'required_points': 1800,
            'required_level': 'PLATA',
            'required_cycle_number': 3,
            'week_number': 3,
            'order': 3
        },
        {
            'name': 'Plata Brillante',
            'description': '¡Tercer ciclo dominado! Eres un ejemplo de perseverancia.',
            'icon': '🥈',
            'required_points': 2400,
            'required_level': 'PLATA',
            'required_cycle_number': 3,
            'week_number': 4,
            'order': 4
        }
    ]
    
    # CICLO 4 - ORO 🥇
    medals_cycle_4 = [
        {
            'name': 'Campeón Hidratación',
            'description': 'Dominio absoluto de los hábitos de hidratación.',
            'icon': '🏆',
            'required_points': 800,
            'required_level': 'ORO',
            'required_cycle_number': 4,
            'week_number': 1,
            'order': 1
        },
        {
            'name': 'Maestro Digestivo',
            'description': 'Has alcanzado la maestría en el cuidado digestivo.',
            'icon': '🌟',
            'required_points': 1600,
            'required_level': 'ORO',
            'required_cycle_number': 4,
            'week_number': 2,
            'order': 2
        },
        {
            'name': 'Campeón de la Hidratación',
            'description': 'Perfección en todos los aspectos de hidratación saludable.',
            'icon': '💫',
            'required_points': 2200,
            'required_level': 'ORO',
            'required_cycle_number': 4,
            'week_number': 3,
            'order': 3
        },
        {
            'name': 'Oro Puro',
            'description': '¡Cuarto ciclo perfecto! Eres una inspiración para otros.',
            'icon': '🥇',
            'required_points': 2800,
            'required_level': 'ORO',
            'required_cycle_number': 4,
            'week_number': 4,
            'order': 4
        }
    ]
    
    # CICLO 5 - PLATINO 💎
    medals_cycle_5 = [
        {
            'name': 'Integración del Cambio',
            'description': 'Has integrado completamente los hábitos en tu vida.',
            'icon': '🔄',
            'required_points': 1000,
            'required_level': 'PLATINO',
            'required_cycle_number': 5,
            'week_number': 1,
            'order': 1
        },
        {
            'name': 'Autonomía en Decisiones',
            'description': 'Tomas decisiones digestivas saludables de forma natural.',
            'icon': '🎯',
            'required_points': 1800,
            'required_level': 'PLATINO',
            'required_cycle_number': 5,
            'week_number': 2,
            'order': 2
        },
        {
            'name': 'Estabilidad Digestiva',
            'description': 'Has logrado una estabilidad digestiva excepcional.',
            'icon': '⚖️',
            'required_points': 2400,
            'required_level': 'PLATINO',
            'required_cycle_number': 5,
            'week_number': 3,
            'order': 3
        },
        {
            'name': 'Platino Elite',
            'description': '¡Quinto ciclo de excelencia! Eres un experto en bienestar digestivo.',
            'icon': '💎',
            'required_points': 3000,
            'required_level': 'PLATINO',
            'required_cycle_number': 5,
            'week_number': 4,
            'order': 4
        }
    ]
    
    # CICLO 6+ - MAESTRO 👑
    medals_cycle_6 = [
        {
            'name': 'Inicio del Compromiso',
            'description': 'El compromiso con tu salud digestiva es inquebrantable.',
            'icon': '💪',
            'required_points': 1200,
            'required_level': 'MAESTRO',
            'required_cycle_number': 6,
            'week_number': 1,
            'order': 1
        },
        {
            'name': 'Constancia Terapéutica',
            'description': 'Mantienes una constancia terapéutica ejemplar.',
            'icon': '📈',
            'required_points': 2000,
            'required_level': 'MAESTRO',
            'required_cycle_number': 6,
            'week_number': 2,
            'order': 2
        },
        {
            'name': 'Conciencia Corporal',
            'description': 'Has desarrollado una conciencia corporal extraordinaria.',
            'icon': '🧠',
            'required_points': 2600,
            'required_level': 'MAESTRO',
            'required_cycle_number': 6,
            'week_number': 3,
            'order': 3
        },
        {
            'name': 'Maestro Absoluto',
            'description': '¡MAESTRO! Has alcanzado el nivel más alto de cuidado digestivo.',
            'icon': '👑',
            'required_points': 3200,
            'required_level': 'MAESTRO',
            'required_cycle_number': 6,
            'week_number': 4,
            'order': 4
        }
    ]
    
    # Crear todas las medallas
    all_medals = medals_cycle_1 + medals_cycle_2 + medals_cycle_3 + medals_cycle_4 + medals_cycle_5 + medals_cycle_6
    
    for medal_data in all_medals:
        Medal.objects.create(**medal_data)

def delete_sample_medals(apps, schema_editor):
    """
    Eliminar las medallas de ejemplo
    """
    Medal = apps.get_model('gamification', 'Medal')
    Medal.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0004_alter_dailypoints_cycle_and_more'),
    ]

    operations = [
        migrations.RunPython(
            create_sample_medals,
            delete_sample_medals,
        ),
    ]