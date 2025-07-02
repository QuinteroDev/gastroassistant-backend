from django.core.management.base import BaseCommand
from learn.models import ContentCategory, UnlockableEducationalContent
from gamification.models import Medal

class Command(BaseCommand):
    help = 'Crea contenido educativo simplificado (1 por medalla)'

    def handle(self, *args, **options):
        # Crear/obtener categoría
        category, created = ContentCategory.objects.get_or_create(
            name='Contenido por Niveles',
            defaults={
                'category_type': 'ADVANCED',
                'description': 'Contenido que se desbloquea al subir de nivel',
                'icon': '🎓',
                'order': 1
            }
        )

        # Eliminar contenido desbloqueado existente
        UnlockableEducationalContent.objects.all().delete()
        self.stdout.write('🧹 Contenido anterior eliminado')

        # Obtener medallas creadas
        medals = Medal.objects.all().order_by('required_points')
        
        if not medals.exists():
            self.stdout.write(self.style.ERROR('❌ No hay medallas. Ejecuta create_simplified_medals primero.'))
            return

        # Crear 1 contenido por medalla
        content_templates = [
            {
                'title': 'Fundamentos del Cuidado Digestivo',
                'summary': 'Aprende los conceptos básicos para mantener una digestión saludable.',
                'content': '''# Fundamentos del Cuidado Digestivo

¡Felicitaciones por alcanzar el nivel Bronce! 🥉

En este artículo aprenderás los fundamentos esenciales para mantener una digestión saludable.

## Conceptos Básicos
- Anatomía digestiva básica
- Proceso de digestión normal
- Factores que afectan la salud digestiva

¡Has demostrado constancia y este es solo el comienzo!'''
            },
            {
                'title': 'Nutrición Avanzada para la Digestión',
                'summary': 'Estrategias nutricionales específicas para optimizar tu salud digestiva.',
                'content': '''# Nutrición Avanzada para la Digestión

¡Excelente progreso alcanzando el nivel Plata! 🥈

Estrategias nutricionales avanzadas para optimizar tu digestión.'''
            },
            {
                'title': 'Técnicas Avanzadas de Manejo del Estrés',
                'summary': 'Domina técnicas profesionales para controlar el estrés digestivo.',
                'content': '''# Técnicas Avanzadas de Manejo del Estrés

¡Felicitaciones por alcanzar el nivel Oro! 🥇

Técnicas profesionales para el manejo del estrés digestivo.'''
            },
            {
                'title': 'Optimización del Estilo de Vida',
                'summary': 'Estrategias de élite para optimizar tu estilo de vida digestivo.',
                'content': '''# Optimización del Estilo de Vida

¡Has alcanzado el prestigioso nivel Platino! 💎

Estrategias de élite para la optimización completa.'''
            },
            {
                'title': 'Maestría en Salud Digestiva',
                'summary': 'Conocimiento de élite para maestros del cuidado digestivo.',
                'content': '''# Maestría en Salud Digestiva

¡Has alcanzado el nivel Maestro! 👑

Conocimiento exclusivo para verdaderos maestros.'''
            },
            {
                'title': 'Sabiduría Digestiva Suprema',
                'summary': 'El conocimiento más exclusivo sobre salud digestiva.',
                'content': '''# Sabiduría Digestiva Suprema

¡Élite Digestiva desbloqueada! ⭐

Contenido exclusivo para la élite digestiva.'''
            }
        ]

        created_count = 0
        for i, medal in enumerate(medals):
            if i < len(content_templates):
                template = content_templates[i]
                
                UnlockableEducationalContent.objects.create(
                    title=template['title'],
                    summary=template['summary'],
                    content=template['content'],
                    category=category,
                    unlock_type='MEDAL',
                    required_medal=medal,
                    estimated_read_time=8,
                    is_active=True,
                    order=i + 1
                )
                
                created_count += 1
                self.stdout.write(f'✅ Creado: {template["title"]} (Medalla: {medal.name})')

        self.stdout.write(self.style.SUCCESS(f'🎉 {created_count} contenidos educativos simplificados creados'))