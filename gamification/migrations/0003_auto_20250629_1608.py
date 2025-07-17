# gamification/migrations/0003_auto_20250629_1608.py
# Reemplazar TODO el contenido del archivo con esto:

from django.db import migrations
from datetime import datetime, timedelta

def populate_cycle_fields(apps, schema_editor):
    """
    Poblar los campos cycle para registros existentes
    """
    DailyPoints = apps.get_model('gamification', 'DailyPoints')
    UserMedal = apps.get_model('gamification', 'UserMedal')
    Medal = apps.get_model('gamification', 'Medal')
    UserLevel = apps.get_model('gamification', 'UserLevel')
    UserCycle = apps.get_model('cycles', 'UserCycle')
    
    # 1. Poblar DailyPoints.cycle
    for daily_point in DailyPoints.objects.filter(cycle__isnull=True):
        # Buscar ciclo que incluya esta fecha
        user_cycle = UserCycle.objects.filter(
            user=daily_point.user,
            start_date__lte=daily_point.date,
            end_date__gte=daily_point.date
        ).first()
        
        if not user_cycle:
            # Si no hay ciclo exacto, buscar el más cercano
            user_cycle = UserCycle.objects.filter(
                user=daily_point.user
            ).order_by('-cycle_number').first()
        
        if user_cycle:
            daily_point.cycle = user_cycle
            daily_point.save()
    
    # 2. Poblar UserMedal.cycle_earned
    for user_medal in UserMedal.objects.filter(cycle_earned__isnull=True):
        # Buscar ciclo activo cuando se ganó la medalla
        user_cycle = UserCycle.objects.filter(
            user=user_medal.user,
            start_date__lte=user_medal.earned_at.date(),
            end_date__gte=user_medal.earned_at.date()
        ).first()
        
        if not user_cycle:
            # Si no hay ciclo exacto, usar el primer ciclo del usuario
            user_cycle = UserCycle.objects.filter(
                user=user_medal.user
            ).order_by('cycle_number').first()
        
        if user_cycle:
            user_medal.cycle_earned = user_cycle
            user_medal.save()
    
    # 3. Poblar Medal.required_cycle_number (mapear mes → ciclo)
    for medal in Medal.objects.filter(required_cycle_number__isnull=True):
        # Si tenía un required_month, usar ese número como cycle_number
        # Si no, poner ciclo 1 por defecto
        medal.required_cycle_number = 1  # Default seguro
        medal.save()
    
    # 4. Poblar UserLevel.current_cycle
    for user_level in UserLevel.objects.filter(current_cycle__isnull=True):
        # Buscar el ciclo activo más reciente del usuario
        current_cycle = UserCycle.objects.filter(
            user=user_level.user,
            status='ACTIVE'
        ).order_by('-cycle_number').first()
        
        if not current_cycle:
            # Si no hay activo, buscar el más reciente
            current_cycle = UserCycle.objects.filter(
                user=user_level.user
            ).order_by('-cycle_number').first()
        
        if current_cycle:
            user_level.current_cycle = current_cycle
            user_level.save()

def reverse_populate_cycle_fields(apps, schema_editor):
    """
    Función de reversa (dejar campos en null)
    """
    DailyPoints = apps.get_model('gamification', 'DailyPoints')
    UserMedal = apps.get_model('gamification', 'UserMedal')
    Medal = apps.get_model('gamification', 'Medal')
    UserLevel = apps.get_model('gamification', 'UserLevel')
    
    DailyPoints.objects.update(cycle=None)
    UserMedal.objects.update(cycle_earned=None)
    Medal.objects.update(required_cycle_number=None)
    UserLevel.objects.update(current_cycle=None)

class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0002_alter_medal_options_remove_medal_required_month_and_more'),
        ('cycles', '0001_initial'),  # Asegurar que cycles existe
    ]

    operations = [
        migrations.RunPython(
            populate_cycle_fields,
            reverse_populate_cycle_fields,
        ),
    ]