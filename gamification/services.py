# gamification/services.py - VERSIÓN ARREGLADA

from django.utils import timezone
from django.db.models import Q
from django.db import models
from datetime import date, timedelta
from .models import UserLevel, Medal, UserMedal, DailyPoints
from habits.models import HabitLog, HabitTracker

class GamificationService:
    """
    Servicio principal para manejar toda la lógica de gamificación
    ARREGLADO: Calcula correctamente los puntos acumulados
    """
    
    # Configuración de puntos (mantener igual)
    POINTS_CONFIG = {
        'habit_normal': [0, 5, 10, 15],  # Por nivel de completado [0,1,2,3]
        'habit_promoted': [0, 10, 20, 30],  # Hábito promocionado x2
        'bonus_all_completed': 25,  # Bonus por completar los 5 hábitos
        'bonus_streak_per_day': 5,  # Bonus por cada día de racha
        'max_streak_bonus': 50,  # Máximo bonus por racha
    }
    
    # Umbrales para cambio de nivel por ciclo (mantener igual)
    LEVEL_THRESHOLDS = {
        1: {'points': 1600, 'level': 'NOVATO'},    
        2: {'points': 1600, 'level': 'BRONCE'},   
        3: {'points': 1600, 'level': 'PLATA'},     
        4: {'points': 1600, 'level': 'ORO'},       
        5: {'points': 1600, 'level': 'PLATINO'},   
        6: {'points': 1600, 'level': 'MAESTRO'},  
    }
    
    @staticmethod
    def get_or_create_user_level(user):
        """
        Obtiene o crea el nivel de gamificación del usuario
        """
        user_level, created = UserLevel.objects.get_or_create(
            user=user,
            defaults={
                'current_level': 'NOVATO',
                'current_cycle': None,
            }
        )
        return user_level
    
    @staticmethod
    def calculate_daily_points(user, target_date=None):
        """
        Calcula los puntos de un día específico para un usuario
        ARREGLADO: Calcula correctamente todos los hábitos del día
        """
        if target_date is None:
            target_date = timezone.now().date()
        
        # Obtener TODOS los logs de hábitos del día
        habit_logs = HabitLog.objects.filter(
            tracker__user=user,
            date=target_date
        ).select_related('tracker__habit', 'tracker')
        
        if not habit_logs.exists():
            return {
                'total_points': 0,
                'habit_points': 0,
                'bonus_completion': 0,
                'bonus_streak': 0,
                'bonus_promoted': 0,
                'habits_completed': 0,
                'habits_total': 0,
                'current_streak': 0
            }
        
        habit_points = 0
        bonus_promoted = 0
        habits_completed = 0
        habits_total = len(habit_logs)
        
        # Calcular puntos por cada hábito
        for log in habit_logs:
            is_promoted = log.tracker.is_promoted
            completion_level = log.completion_level
            
            if is_promoted:
                points = GamificationService.POINTS_CONFIG['habit_promoted'][completion_level]
                bonus_promoted += points - GamificationService.POINTS_CONFIG['habit_normal'][completion_level]
                habit_points += points
            else:
                points = GamificationService.POINTS_CONFIG['habit_normal'][completion_level]
                habit_points += points
            
            # Contar como completado si es nivel 2 o 3
            if completion_level >= 2:
                habits_completed += 1
        
        # Bonus por completar todos los hábitos
        bonus_completion = 0
        if habits_completed == habits_total and habits_total > 0:
            bonus_completion = GamificationService.POINTS_CONFIG['bonus_all_completed']
        
        # Bonus por racha
        current_streak = GamificationService.calculate_streak_on_date(user, target_date)
        bonus_streak = min(
            current_streak * GamificationService.POINTS_CONFIG['bonus_streak_per_day'],
            GamificationService.POINTS_CONFIG['max_streak_bonus']
        )
        
        total_points = habit_points + bonus_completion + bonus_streak
        
        return {
            'total_points': total_points,
            'habit_points': habit_points,
            'bonus_completion': bonus_completion,
            'bonus_streak': bonus_streak,
            'bonus_promoted': bonus_promoted,
            'habits_completed': habits_completed,
            'habits_total': habits_total,
            'current_streak': current_streak
        }
    
    @staticmethod
    def calculate_streak_on_date(user, target_date):
        """
        Calcula la racha de días consecutivos hasta una fecha específica
        """
        current_date = target_date
        streak = 0
        
        # Mirar hacia atrás desde la fecha objetivo
        while True:
            # Verificar si completó los hábitos este día
            daily_logs = HabitLog.objects.filter(
                tracker__user=user,
                date=current_date
            )
            
            if not daily_logs.exists():
                break
            
            # Contar hábitos completados (nivel 2 o 3)
            completed_count = daily_logs.filter(completion_level__gte=2).count()
            total_count = daily_logs.count()
            
            # Si no completó todos los hábitos, rompe la racha
            if completed_count < total_count or total_count == 0:
                break
            
            streak += 1
            current_date -= timedelta(days=1)
        
        return streak
    
    @staticmethod
    def update_daily_points(user, target_date=None):
        """
        Actualiza o crea el registro de puntos diarios para un usuario
        ARREGLADO: Maneja correctamente la acumulación de puntos
        """
        if target_date is None:
            target_date = timezone.now().date()
        
        # Verificar que el usuario tenga un ciclo activo
        user_level = GamificationService.get_or_create_user_level(user)
        if not user_level.current_cycle:
            # Si no tiene ciclo, buscar uno activo
            from cycles.models import UserCycle
            active_cycle = UserCycle.objects.filter(
                user=user,
                status='ACTIVE'
            ).order_by('-cycle_number').first()
            
            if not active_cycle:
                print(f"⚠️ Usuario {user.username} no tiene ciclo activo - saltando gamificación")
                return None
            
            user_level.current_cycle = active_cycle
            user_level.save()
        
        # Calcular puntos del día
        points_data = GamificationService.calculate_daily_points(user, target_date)
        
        # ARREGLADO: Crear o actualizar registro de puntos diarios
        daily_points, created = DailyPoints.objects.update_or_create(
            user=user,
            date=target_date,
            defaults={
                'cycle': user_level.current_cycle,
                'habit_points': points_data['habit_points'],
                'bonus_completion': points_data['bonus_completion'],
                'bonus_streak': points_data['bonus_streak'],
                'bonus_promoted_habit': points_data['bonus_promoted'],
                'total_points': points_data['total_points'],
                'habits_completed': points_data['habits_completed'],
                'habits_total': points_data['habits_total'],
                'streak_on_date': points_data['current_streak']
            }
        )
        
        return daily_points
    
    @staticmethod
    def update_user_level_progress(user):
        """
        Actualiza el progreso y nivel del usuario basado en puntos acumulados
        ARREGLADO: Calcula correctamente los puntos totales del ciclo
        """
        user_level = GamificationService.get_or_create_user_level(user)
        
        # Si no tiene ciclo asignado, buscar el activo
        if not user_level.current_cycle:
            from cycles.models import UserCycle
            active_cycle = UserCycle.objects.filter(
                user=user,
                status='ACTIVE'
            ).order_by('-cycle_number').first()
            
            if active_cycle:
                user_level.current_cycle = active_cycle
                user_level.save()
        
        # Guardar nivel anterior para detectar cambios
        previous_level = user_level.current_level
        
        # ARREGLADO: Calcular puntos del ciclo actual correctamente
        if user_level.current_cycle:
            # Sumar TODOS los puntos de TODOS los días del ciclo
            current_cycle_points = DailyPoints.objects.filter(
                user=user,
                cycle=user_level.current_cycle
            ).aggregate(
                total=models.Sum('total_points')
            )['total'] or 0
            
            # Actualizar puntos del ciclo
            user_level.current_cycle_points = current_cycle_points
            
            # Verificar si puede subir de nivel
            cycle_number = user_level.current_cycle.cycle_number
            threshold_data = GamificationService.LEVEL_THRESHOLDS.get(cycle_number)
            
            if threshold_data and current_cycle_points >= threshold_data['points']:
                # Solo subir si el nuevo nivel es superior al actual
                new_level = threshold_data['level']
                level_order = ['NOVATO', 'BRONCE', 'PLATA', 'ORO', 'PLATINO', 'MAESTRO']
                
                current_index = level_order.index(user_level.current_level)
                new_index = level_order.index(new_level)
                
                if new_index > current_index:
                    user_level.current_level = new_level
        
        # Actualizar racha actual
        today = timezone.now().date()
        user_level.current_streak = GamificationService.calculate_streak_on_date(user, today)
        user_level.last_activity_date = today
        
        # Actualizar racha más larga si es necesario
        if user_level.current_streak > user_level.longest_streak:
            user_level.longest_streak = user_level.current_streak
        
        user_level.save()
        
        # Devolver si hubo cambio de nivel
        level_changed = previous_level != user_level.current_level
        
        return user_level, level_changed
    
    @staticmethod
    def check_new_medals(user):
        """
        Verifica si el usuario ha desbloqueado nuevas medallas
        ARREGLADO: Verifica correctamente los criterios de medallas
        """
        user_level = GamificationService.get_or_create_user_level(user)
        
        if not user_level.current_cycle:
            return []
        
        # Obtener medallas ya ganadas por el usuario
        earned_medal_ids = UserMedal.objects.filter(user=user).values_list('medal_id', flat=True)
        
        # Buscar medallas disponibles que cumplan criterios
        available_medals = Medal.objects.filter(
            is_active=True,
            required_points__lte=user_level.current_cycle_points,
            required_cycle_number__lte=user_level.current_cycle.cycle_number
        ).exclude(
            id__in=earned_medal_ids
        )
        
        # Filtrar por nivel actual o inferior
        level_order = ['NOVATO', 'BRONCE', 'PLATA', 'ORO', 'PLATINO', 'MAESTRO']
        current_level_index = level_order.index(user_level.current_level)
        
        eligible_levels = level_order[:current_level_index + 1]
        available_medals = available_medals.filter(required_level__in=eligible_levels)
        
        new_medals = []
        for medal in available_medals:
            # Verificar criterios especiales según el nombre de la medalla
            if GamificationService._check_special_medal_criteria(user, medal):
                user_medal = UserMedal.objects.create(
                    user=user,
                    medal=medal,
                    cycle_earned=user_level.current_cycle,
                    points_when_earned=user_level.current_cycle_points,
                    level_when_earned=user_level.current_level
                )
                new_medals.append(user_medal)
        
        return new_medals
    
    @staticmethod
    def _check_special_medal_criteria(user, medal):
        """
        Verifica criterios especiales para medallas específicas
        """
        medal_name = medal.name.lower()
        
        # Medallas basadas en racha
        if 'racha' in medal_name or 'consecutivos' in medal_name:
            current_streak = GamificationService.calculate_streak_on_date(user, timezone.now().date())
            
            if '3 días' in medal.description:
                return current_streak >= 3
            elif '10 días' in medal.description:
                return current_streak >= 10
            elif '15 días' in medal.description:
                return current_streak >= 15
            elif '21 días' in medal.description:
                return current_streak >= 21
        
        # Medallas basadas en semanas completas
        if 'semana' in medal_name.lower() or 'semana' in medal.description.lower():
            return GamificationService._check_week_completion(user)
        
        # Medallas basadas en días perfectos
        if 'perfect' in medal_name or 'perfecta' in medal.description.lower():
            perfect_days = GamificationService._count_perfect_days(user)
            
            if '15 días' in medal.description:
                return perfect_days >= 15
        
        # Por defecto, solo verificar puntos y nivel (ya filtrado en la consulta principal)
        return True
    
    @staticmethod
    def _check_week_completion(user):
        """
        Verifica si el usuario completó una semana completa consecutiva
        """
        today = timezone.now().date()
        
        # Verificar los últimos 7 días
        for i in range(7):
            check_date = today - timedelta(days=i)
            
            daily_logs = HabitLog.objects.filter(
                tracker__user=user,
                date=check_date
            )
            
            if not daily_logs.exists():
                return False
            
            # Verificar que todos los hábitos estén completados (nivel >= 2)
            completed_count = daily_logs.filter(completion_level__gte=2).count()
            total_count = daily_logs.count()
            
            if completed_count < total_count:
                return False
        
        return True
    
    @staticmethod
    def _count_perfect_days(user):
        """
        Cuenta los días donde el usuario obtuvo puntuación perfecta
        """
        if not hasattr(user, 'userlevel') or not user.userlevel.current_cycle:
            return 0
        
        # Un día perfecto es cuando todos los hábitos están en nivel 3
        perfect_days = 0
        
        # Obtener todos los días con registros en el ciclo actual
        dates_with_logs = HabitLog.objects.filter(
            tracker__user=user,
            date__gte=user.userlevel.current_cycle.start_date,
            date__lte=timezone.now().date()
        ).values_list('date', flat=True).distinct()
        
        for log_date in dates_with_logs:
            daily_logs = HabitLog.objects.filter(
                tracker__user=user,
                date=log_date
            )
            
            # Verificar que todos estén en nivel 3
            if daily_logs.exists():
                level_3_count = daily_logs.filter(completion_level=3).count()
                total_count = daily_logs.count()
                
                if level_3_count == total_count and total_count > 0:
                    perfect_days += 1
        
        return perfect_days
    
    @staticmethod
    def process_daily_gamification(user, target_date=None):
        """
        Proceso completo de gamificación para un día específico.
        ARREGLADO: Funciona correctamente para todos los usuarios
        """
        if target_date is None:
            target_date = timezone.now().date()
        
        # 1. Actualizar puntos diarios
        daily_points = GamificationService.update_daily_points(user, target_date)
        
        if not daily_points:
            # Si no se pudo crear DailyPoints (sin ciclo), retornar estado básico
            user_level = GamificationService.get_or_create_user_level(user)
            return {
                'daily_points': None,
                'user_level': user_level,
                'new_medals': [],
                'level_up': False,
                'level_changed': False
            }
        
        # 2. Actualizar nivel y progreso
        user_level, level_changed = GamificationService.update_user_level_progress(user)
        
        # 3. Verificar nuevas medallas (especialmente importante si cambió de nivel)
        new_medals = GamificationService.check_new_medals(user)
        
        return {
            'daily_points': daily_points,
            'user_level': user_level,
            'new_medals': new_medals,
            'level_up': len(new_medals) > 0,
            'level_changed': level_changed,
            'points_earned': daily_points.total_points
        }