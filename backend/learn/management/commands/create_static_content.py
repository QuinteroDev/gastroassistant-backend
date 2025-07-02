# learn/management/commands/create_static_content.py
from django.core.management.base import BaseCommand
from learn.models import ContentCategory, StaticEducationalContent

class Command(BaseCommand):
    help = 'Crea contenido educativo estático (disponible para todos)'

    def handle(self, *args, **options):
        # Crear/obtener categoría básica
        category, created = ContentCategory.objects.get_or_create(
            name='Contenido General',
            defaults={
                'category_type': 'BASIC',
                'description': 'Contenido educativo básico disponible para todos',
                'icon': '📚',
                'order': 0
            }
        )

        # Eliminar contenido estático anterior
        StaticEducationalContent.objects.all().delete()
        self.stdout.write('🧹 Contenido estático anterior eliminado')

        # Crear contenido estático básico
        static_content = [
            {
                'title': '¿Por qué no todos los síntomas digestivos son reflujo?',
                'summary': 'Aprende a distinguir entre diferentes tipos de molestias digestivas y cuándo pueden ser reflujo.',
                'content': '''Muchas personas sienten ardor, molestias en el estómago o acidez y piensan que tienen reflujo, pero no siempre es así. Hay varios cuadros clínicos que pueden generar sensaciones parecidas:

**ERGE:** hay reflujo de ácido desde el estómago al esófago y puede o no haber daño visible en las pruebas.

**Pirosis funcional:** hay ardor pero sin hallazgos en pruebas. Se trata de una mayor sensibilidad del esófago.

**Hipersensibilidad esofágica:** el ácido llega en cantidades normales pero se percibe con intensidad.

**Dispepsia funcional:** sensación de llenado rápido, pesadez o molestia sin que haya reflujo real.

⚠️ **Importante:** Autodiagnosticarse puede llevar a tratar mal el problema. Por eso es clave una buena valoración médica.

💡 **Recuerda:** No todos los ardores son reflujo ácido. Cada caso tiene su origen y su abordaje específico.''',
                'estimated_read_time': 4,
                'order': 1
            },
            {
                'title': 'La importancia de las pruebas: cuándo son necesarias',
                'summary': 'Entiende cuándo necesitas hacerte pruebas como endoscopia o pH-metría y cuándo no.',
                'content': '''No todas las personas necesitan pruebas invasivas como la endoscopia o la pH-metría. La guía médica indica que:

**Si los síntomas son clásicos y no hay signos de alarma,** se puede empezar con medidas y tratamiento sin pruebas.

**La endoscopia está indicada si hay:**
- Dificultad para tragar
- Anemia o sangrado digestivo
- Pérdida de peso inexplicada
- Síntomas persistentes que no mejoran

**La pH-metría se utiliza cuando:**
- Los síntomas no mejoran con tratamiento
- Hay dudas diagnósticas
- Se necesita confirmar el reflujo

⚠️ **Cuidado:** Hacerse pruebas sin criterio puede llevar a confusión, sobretratamiento o ansiedad innecesaria.

💡 **Consejo:** Si tus síntomas son nuevos, cambia tus hábitos y observa. Si persisten o son intensos, consulta con tu médico para valorar si necesitas exploraciones.''',
                'estimated_read_time': 3,
                'order': 2
            },
            {
                'title': '¿Existen alimentos prohibidos? La evidencia real',
                'summary': 'La verdad sobre las restricciones alimentarias en el reflujo según la evidencia científica.',
                'content': '''Una de las dudas más frecuentes: ¿hay alimentos prohibidos si tengo reflujo?

**La respuesta de la guía es clara: no hay alimentos universalmente prohibidos.** Cada persona puede tener desencadenantes distintos.

**Alimentos que pueden empeorar síntomas EN ALGUNAS PERSONAS:**
- Grasas y fritos
- Chocolate y café
- Picantes y especias
- Bebidas gaseosas
- Alcohol y cítricos

**Pero si no notas relación directa con ellos, no es necesario evitarlos.**

⚠️ **Problema:** Hacer dietas excesivamente restrictivas puede generar más ansiedad, peor relación con la comida y nutrición incompleta.

💡 **Recomendación:** Escúchate a ti mismo. Si detectas algún alimento que empeora tus síntomas, reduce su consumo, pero no elimines por eliminar.

**La clave está en la personalización, no en las prohibiciones generales.**''',
                'estimated_read_time': 5,
                'order': 3
            },
            {
                'title': 'Cómo afecta el estrés a tu digestión',
                'summary': 'Descubre la conexión real entre estrés y síntomas digestivos y qué puedes hacer al respecto.',
                'content': '''El estrés no solo afecta la mente. También influye directamente en el sistema digestivo.

**La investigación muestra que:**
- Las personas con reflujo pueden tener mayor sensibilidad al ácido cuando están estresadas
- El estrés puede alterar la motilidad digestiva y la percepción de los síntomas
- En casos de hipersensibilidad, el componente emocional es especialmente relevante

**🤔 Punto clave:** A veces no se trata de tener más ácido, sino de estar más reactivo a él.

**Estrategias que ayudan:**
- Técnicas de respiración consciente
- Momentos de autocuidado diarios
- Ejercicio regular moderado
- Mejor calidad del sueño
- Manejo de situaciones estresantes

💡 **Herramienta clave:** Trabajar la regulación emocional no es secundario: es parte integral del tratamiento.

**El eje intestino-cerebro es real y bidireccional.**''',
                'estimated_read_time': 4,
                'order': 4
            }
        ]

        created_count = 0
        for content_data in static_content:
            StaticEducationalContent.objects.create(
                title=content_data['title'],
                summary=content_data['summary'],
                content=content_data['content'],
                category=category,
                estimated_read_time=content_data['estimated_read_time'],
                is_published=True,
                order=content_data['order']
            )
            
            created_count += 1
            self.stdout.write(f'✅ Creado: {content_data["title"]}')

        self.stdout.write(self.style.SUCCESS(f'🎉 {created_count} artículos estáticos creados'))
        self.stdout.write(self.style.SUCCESS('📚 Ahora todos los usuarios verán contenido en la sección General'))