# cycles/management/commands/simulate_cycle.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.models import UserCycle
from cycles.services import CycleService
from gamification.models import UserLevel, DailyPoints
from gamification.services import GamificationService
from habits.models import HabitLog
import random


class Command(BaseCommand):
    help = 'Simula el progreso de un ciclo completo para testing'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'username', 
            type=str, 
            help='Username del usuario (ej: probar_ciclo)'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de días a simular (default: 30)'
        )
        parser.add_argument(
            '--with-activity',
            action='store_true',
            help='Simular actividad diaria de hábitos'
        )
        parser.add_argument(
            '--points',
            type=int,
            default=1600,
            help='Puntos totales a acumular (default: 1600)'
        )
    
    def handle(self, *args, **options):
        username = options['username']
        days = options['days']
        with_activity = options['with_activity']
        target_points = options['points']
        
        try:
            # Obtener o crear usuario
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@test.com',
                    'first_name': 'Usuario',
                    'last_name': 'Prueba'
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Usuario {username} creado')
                )
                # Crear perfil si no existe
                from profiles.models import UserProfile
                UserProfile.objects.get_or_create(user=user)
            
            # Obtener ciclo activo
            cycle = UserCycle.objects.filter(
                user=user,
                status='ACTIVE'
            ).first()
            
            if not cycle:
                # Crear ciclo si no existe
                self.stdout.write(
                    self.style.WARNING(f'No se encontró ciclo activo, creando uno nuevo...')
                )
                cycle = CycleService.create_new_cycle(user)
                # Simular que el onboarding está completo
                cycle.onboarding_completed_at = timezone.now()
                cycle.save()
            
            # Mostrar estado inicial
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n📊 Estado inicial del ciclo {cycle.cycle_number}:\n'
                    f'- Inicio: {cycle.start_date.strftime("%Y-%m-%d")}\n'
                    f'- Fin: {cycle.end_date.strftime("%Y-%m-%d")}\n'
                    f'- Estado: {cycle.status}\n'
                    f'- Días transcurridos: {cycle.days_elapsed}\n'
                    f'- Días restantes: {cycle.days_remaining}'
                )
            )
            
            # Actualizar fechas del ciclo
            new_start = timezone.now() - timedelta(days=days)
            cycle.start_date = new_start
            cycle.end_date = new_start + timedelta(days=30)
            cycle.save()
            
            # Simular actividad si se solicita
            if with_activity:
                self.stdout.write(
                    self.style.SUCCESS(f'\n🎯 Simulando actividad de {days} días...')
                )
                
                # Obtener o crear level
                user_level = GamificationService.get_or_create_user_level(user)
                user_level.current_cycle = cycle
                user_level.save()
                
                # Obtener trackers de hábitos
                from habits.models import HabitTracker
                trackers = HabitTracker.objects.filter(user=user, is_active=True)[:5]
                
                if not trackers.exists():
                    self.stdout.write(
                        self.style.WARNING('No hay trackers de hábitos, creando algunos...')
                    )
                    # Crear algunos hábitos de prueba
                    from questionnaires.models import HabitQuestion
                    habit_types = ['MEAL_SIZE', 'DINNER_TIME', 'LIE_DOWN', 'SMOKING', 'ALCOHOL']
                    for i, habit_type in enumerate(habit_types[:5]):
                        habit, _ = HabitQuestion.objects.get_or_create(
                            habit_type=habit_type,
                            defaults={'text': f'Hábito {habit_type}'}
                        )
                        tracker = HabitTracker.objects.create(
                            user=user,
                            habit=habit,
                            is_promoted=(i == 0)  # Promocionar el primero
                        )
                        trackers = list(trackers) + [tracker]
                
                # Calcular puntos por día para alcanzar el objetivo
                daily_points_needed = target_points // days
                total_points_accumulated = 0
                
                # Simular logs para cada día
                for day in range(days):
                    date = new_start.date() + timedelta(days=day)
                    
                    # Crear logs con diferentes niveles de completado
                    daily_points = 0
                    habits_completed = 0
                    
                    for tracker in trackers[:5]:  # Solo los primeros 5
                        # Variar el nivel de completado (más alto hacia el final)
                        if day < 10:
                            level = random.choice([1, 2, 2, 3])  # Principio: más variado
                        else:
                            level = random.choice([2, 3, 3, 3])  # Final: mejor desempeño
                        
                        HabitLog.objects.update_or_create(
                            tracker=tracker,
                            date=date,
                            defaults={'completion_level': level}
                        )
                        
                        # Calcular puntos
                        if tracker.is_promoted:
                            points = [0, 10, 20, 30][level]
                        else:
                            points = [0, 5, 10, 15][level]
                        
                        daily_points += points
                        if level >= 2:
                            habits_completed += 1
                    
                    # Bonus por completar todos
                    if habits_completed == 5:
                        daily_points += 25
                    
                    # Bonus por racha
                    if day > 0:
                        streak_bonus = min(day * 5, 50)
                        daily_points += streak_bonus
                    
                    # Crear registro de puntos diarios
                    DailyPoints.objects.update_or_create(
                        user=user,
                        date=date,
                        defaults={
                            'cycle': cycle,
                            'total_points': daily_points,
                            'habits_completed': habits_completed,
                            'habits_total': 5
                        }
                    )
                    
                    total_points_accumulated += daily_points
                    
                    # Mostrar progreso cada 5 días
                    if (day + 1) % 5 == 0:
                        self.stdout.write(
                            f'  Día {day + 1}: {total_points_accumulated} puntos acumulados'
                        )
                
                # Actualizar nivel del usuario
                user_level.current_cycle_points = total_points_accumulated
                if total_points_accumulated >= 1600:
                    # Subir de nivel según el ciclo
                    level_map = {
                        1: 'BRONCE',
                        2: 'PLATA', 
                        3: 'ORO',
                        4: 'PLATINO',
                        5: 'MAESTRO',
                        6: 'MAESTRO'
                    }
                    if cycle.cycle_number in level_map:
                        user_level.current_level = level_map[cycle.cycle_number]
                
                user_level.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n🏆 Actividad simulada:\n'
                        f'- Puntos totales: {total_points_accumulated}\n'
                        f'- Nivel actual: {user_level.current_level}\n'
                        f'- Medalla ganada: {"✅" if total_points_accumulated >= 1600 else "❌"}'
                    )
                )
            
            # Verificar y actualizar estado del ciclo
            cycle.check_and_update_status()
            
            # Mostrar estado final
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n📊 Estado final del ciclo:\n'
                    f'- Estado: {cycle.status}\n'
                    f'- Días transcurridos: {cycle.days_elapsed}\n'
                    f'- Días restantes: {cycle.days_remaining}\n'
                )
            )
            
            if cycle.status == 'PENDING_RENEWAL':
                self.stdout.write(
                    self.style.WARNING(
                        f'\n⚠️  El ciclo está listo para renovación!\n'
                        f'El usuario verá el modal de renovación en la app.'
                    )
                )
            
            # Comando para probar el siguiente paso
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n💡 Para crear el siguiente ciclo, ejecuta:\n'
                    f'python manage.py shell -c "from cycles.services import CycleService; '
                    f'from django.contrib.auth.models import User; '
                    f'u = User.objects.get(username=\'{username}\'); '
                    f'CycleService.create_new_cycle(u)"'
                )
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Usuario {username} no encontrado')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )
            import traceback
            traceback.print_exc()