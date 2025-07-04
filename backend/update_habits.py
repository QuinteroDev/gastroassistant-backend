# update_habits.py
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gastro_assistant.settings')
django.setup()

from questionnaires.models import HabitQuestion, HabitOption

def update_habit_questionnaire():
    """
    Actualizar el cuestionario de hábitos completamente
    """
    
    print("🚀 Iniciando actualización del cuestionario de hábitos...")
    
    # 1. Eliminar datos existentes
    print("🗑️ Eliminando preguntas y opciones existentes...")
    deleted_options = HabitOption.objects.all().delete()[0]
    deleted_questions = HabitQuestion.objects.all().delete()[0]
    
    print(f"   ✅ Eliminadas {deleted_options} opciones")
    print(f"   ✅ Eliminadas {deleted_questions} preguntas")
    
    # 2. Crear las nuevas preguntas
    print("📝 Creando nuevas preguntas...")
    
    # Lista completa de preguntas con sus opciones
    questions_data = [
        {
            'id': 1,
            'habit_type': 'MEAL_SIZE',
            'text': '¿Sientes que comes más cantidad de la que tu cuerpo tolera bien?',
            'description': 'El exceso de comida aumenta la presión sobre el esfínter esofágico inferior y dificulta el vaciamiento gástrico, exacerbando el reflujo.',
            'options': [
                ('Siempre como más de lo que debería', 0, 1),
                ('A menudo me paso con la cantidad', 1, 2),
                ('A veces me cuesta controlarlo', 2, 3),
                ('Suelo comer lo justo y me siento bien', 3, 4),
            ]
        },
        {
            'id': 2,
            'habit_type': 'DINNER_TIME',
            'text': '¿Cuánto tiempo dejas entre la cena y el momento de acostarte?',
            'description': 'Acostarse con el estómago lleno facilita el reflujo nocturno, ya que la posición horizontal favorece que el ácido suba por el esófago.',
            'options': [
                ('Menos de 1 hora', 0, 1),
                ('Entre 1 y 2 horas', 1, 2),
                ('Entre 2 y 3 horas', 2, 3),
                ('Más de 3 horas', 3, 4),
            ]
        },
        {
            'id': 3,
            'habit_type': 'LIE_DOWN',
            'text': '¿Te tumbas o recuestas justo después de comer?',
            'description': 'La posición horizontal facilita el reflujo del contenido gástrico hacia el esófago, especialmente si el estómago está lleno.',
            'options': [
                ('Siempre', 0, 1),
                ('A menudo', 1, 2),
                ('A veces', 2, 3),
                ('Rara vez o nunca', 3, 4),
            ]
        },
        {
            'id': 4,
            'habit_type': 'SMOKING',
            'text': '¿Fumas actualmente?',
            'description': 'El tabaco debilita el esfínter esofágico inferior y aumenta la producción de ácido en el estómago, siendo un importante factor de riesgo para el reflujo.',
            'options': [
                ('Sí, todos los días', 0, 1),
                ('Sí, ocasionalmente', 1, 2),
                ('Lo he dejado', 2, 3),
                ('Nunca he fumado', 3, 4),
            ]
        },
        {
            'id': 5,
            'habit_type': 'ALCOHOL',
            'text': '¿Consumes alcohol más de 3 veces por semana?',
            'description': 'El alcohol relaja el esfínter esofágico inferior y puede irritar directamente la mucosa esofágica, aumentando los síntomas de reflujo.',
            'options': [
                ('Sí, frecuentemente', 0, 1),
                ('Sí, a veces', 1, 2),
                ('Muy ocasionalmente', 2, 3),
                ('Nunca', 3, 4),
            ]
        },
        {
            'id': 6,
            'habit_type': 'EXERCISE',
            'text': '¿Te mantienes activo/a durante el día, caminando o haciendo ejercicio físico?',
            'description': 'El movimiento diario, aunque sea suave, puede mejorar la digestión, reducir la presión abdominal y ayudar al bienestar general.',
            'options': [
                ('No suelo moverme mucho', 0, 1),
                ('Solo algunos días concretos', 1, 2),
                ('Me mantengo activo/a varios días por semana', 2, 3),
                ('Sí, camino o me muevo todos los días', 3, 4),
            ]
        },
        {
            'id': 7,
            'habit_type': 'AVOID_TRIGGERS',
            'text': '¿Sueles evitar alimentos o bebidas que tú mismo/a has notado que te provocan síntomas?',
            'description': 'Cada persona reacciona de forma distinta. Esta pregunta evalúa si identificas y ajustas tu alimentación según lo que te sienta bien o mal.',
            'options': [
                ('No los evito aunque me sienten mal', 0, 1),
                ('A veces los evito', 1, 2),
                ('Suelo evitarlos', 2, 3),
                ('Los tengo totalmente identificados y evitados', 3, 4),
            ]
        },
        {
            'id': 8,
            'habit_type': 'STRESS',
            'text': '¿Crees que el estrés afecta a tu digestión o tus síntomas?',
            'description': 'El estrés puede aumentar la percepción del dolor y alterar la motilidad digestiva, empeorando los síntomas de reflujo en muchas personas.',
            'options': [
                ('Sí, y no hago nada al respecto', 0, 1),
                ('Sí, y lo intento manejar sin éxito', 1, 2),
                ('Lo manejo con herramientas o apoyo ocasional', 2, 3),
                ('Estoy trabajando activamente en ello (relajación, terapia, etc.)', 3, 4),
            ]
        },
        {
            'id': 9,
            'habit_type': 'HYDRATION_MEALS',
            'text': '¿Bebes grandes cantidades de agua u otros líquidos mientras comes?',
            'description': 'Beber mucho durante las comidas puede aumentar la presión en el estómago y diluir los ácidos gástricos, dificultando la digestión.',
            'options': [
                ('Siempre', 0, 1),
                ('A menudo', 1, 2),
                ('A veces', 2, 3),
                ('Rara vez o nunca', 3, 4),
            ]
        },
        {
            'id': 10,
            'habit_type': 'HYDRATION_DAY',
            'text': '¿Bebes suficiente agua a lo largo del día (no solo en las comidas)?',
            'description': 'La hidratación adecuada facilita la digestión y la salud del tracto digestivo, pero es mejor beber entre comidas que durante ellas.',
            'options': [
                ('Muy poca, menos de 1 litro diario', 0, 1),
                ('Aproximadamente 1 litro', 1, 2),
                ('Entre 1,5 y 2 litros', 2, 3),
                ('Más de 2 litros y de forma repartida', 3, 4),
            ]
        },
        {
            'id': 11,
            'habit_type': 'CHEWING',
            'text': '¿Dedicas tiempo suficiente a masticar bien los alimentos antes de tragarlos?',
            'description': 'Masticar bien inicia la digestión en la boca, reduce el trabajo del estómago y previene la ingesta de aire que puede empeorar el reflujo.',
            'options': [
                ('No, como muy rápido y apenas mastico', 0, 1),
                ('Lo intento, pero me cuesta', 1, 2),
                ('Suelo masticar bien la mayor parte del tiempo', 2, 3),
                ('Siempre mastico despacio y con calma', 3, 4),
            ]
        },
        {
            'id': 12,
            'habit_type': 'PROCESSED_FOODS',
            'text': '¿Sueles consumir alimentos muy procesados (bollería, snacks, comida rápida, precocinados)?',
            'description': 'Un consumo frecuente de alimentos ultraprocesados puede afectar la salud digestiva y desplazar alimentos más nutritivos que favorecen la recuperación.',
            'options': [
                ('Rara vez o nunca', 3, 1),
                ('Ocasionalmente', 2, 2),
                ('Varias veces a la semana', 1, 3),
                ('Sí, a diario', 0, 4),
            ]
        },
        {
            'id': 13,
            'habit_type': 'MINDFUL_EATING',
            'text': '¿Sientes que comes con distracciones (pantalla, móvil, trabajo)?',
            'description': 'Comer distraído se asocia con menor masticación, mayor ingesta y peor consciencia digestiva.',
            'options': [
                ('Siempre como distraído', 0, 1),
                ('A menudo', 1, 2),
                ('A veces', 2, 3),
                ('No, como de forma presente y consciente', 3, 4),
            ]
        }
    ]
    
    # Crear preguntas y opciones
    for q_data in questions_data:
        # Crear pregunta
        question = HabitQuestion.objects.create(
            id=q_data['id'],
            habit_type=q_data['habit_type'],
            text=q_data['text'],
            description=q_data['description']
        )
        
        # Crear opciones para esta pregunta
        for i, (text, value, order) in enumerate(q_data['options']):
            HabitOption.objects.create(
                question=question,
                text=text,
                value=value,
                order=order
            )
        
        print(f"   ✅ Creada pregunta {q_data['id']}: {q_data['habit_type']}")
    
    print("🎉 Cuestionario de hábitos actualizado correctamente!")
    print(f"📊 Total: {HabitQuestion.objects.count()} preguntas creadas")
    print(f"📊 Total: {HabitOption.objects.count()} opciones creadas")

if __name__ == "__main__":
    update_habit_questionnaire()