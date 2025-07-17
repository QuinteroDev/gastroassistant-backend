# learn/services.py
from django.utils import timezone
from .models import (
    StaticEducationalContent, 
    UnlockableEducationalContent, 
    UserContentAccess,
    UserReadingSession
)
from gamification.models import UserLevel, UserMedal

class ContentUnlockService:
    """Servicio para manejar el desbloqueo de contenidos - CON LÓGICA REAL"""
    
    @staticmethod
    def check_and_unlock_content(user):
        """
        Verifica y desbloquea contenido para un usuario
        LÓGICA SIMPLE: Crea acceso automático al contenido disponible
        """
        try:
            user_level = getattr(user, 'gamification_level', None)
        except:
            # Si no tiene gamification_level, crearlo básico
            from gamification.services import GamificationService
            user_level = GamificationService.get_or_create_user_level(user)
        
        newly_unlocked = []
        
        # 1. CONTENIDO ESTÁTICO - SIEMPRE DISPONIBLE PARA TODOS
        # Obtener todo el contenido estático que existe
        all_static_content = StaticEducationalContent.objects.filter(is_published=True)
        
        # Ver cuál ya tiene acceso el usuario
        existing_static_access = UserContentAccess.objects.filter(
            user=user,
            static_content__isnull=False
        ).values_list('static_content_id', flat=True)
        
        # Crear acceso para el contenido que NO tiene
        for content in all_static_content:
            if content.id not in existing_static_access:
                access = UserContentAccess.objects.create(
                    user=user,
                    static_content=content
                )
                newly_unlocked.append(access)
        
        # 2. CONTENIDO DESBLOQUEADO POR MEDALLAS
        # Solo si tiene medallas
        user_medals = UserMedal.objects.filter(user=user).values_list('medal_id', flat=True)
        
        if user_medals.exists():
            # Contenido que requiere esas medallas
            medal_content = UnlockableEducationalContent.objects.filter(
                unlock_type='MEDAL',
                required_medal_id__in=user_medals,
                is_active=True
            )
            
            # Ver cuál ya tiene acceso
            existing_unlocked_access = UserContentAccess.objects.filter(
                user=user,
                unlockable_content__isnull=False
            ).values_list('unlockable_content_id', flat=True)
            
            # Crear acceso para contenido nuevo
            for content in medal_content:
                if content.id not in existing_unlocked_access:
                    access = UserContentAccess.objects.create(
                        user=user,
                        unlockable_content=content
                    )
                    newly_unlocked.append(access)
        
        return newly_unlocked
    
    @staticmethod
    def get_user_available_content(user):
        """
        SIMPLE: Obtiene todo el contenido al que el usuario tiene acceso
        """
        return UserContentAccess.objects.filter(user=user).select_related(
            'static_content',
            'unlockable_content',
            'static_content__category',
            'unlockable_content__category'
        ).order_by('unlocked_at')
    
    @staticmethod
    def get_locked_content_preview(user):
        """
        SIMPLE: Muestra contenido que puede desbloquear pronto
        """
        try:
            user_level = getattr(user, 'gamification_level', None)
            if not user_level:
                return []
        except:
            return []
        
        locked_content = []
        
        # Contenido ya desbloqueado (para excluir)
        user_unlocked_ids = UserContentAccess.objects.filter(
            user=user,
            unlockable_content__isnull=False
        ).values_list('unlockable_content_id', flat=True)
        
        # Buscar próximas medallas a conseguir
        if user_level.current_cycle:
            from gamification.models import Medal
            
            # Medallas del ciclo actual que aún no tiene
            user_medal_ids = UserMedal.objects.filter(user=user).values_list('medal_id', flat=True)
            
            next_medals = Medal.objects.filter(
                required_cycle_number=user_level.current_cycle.cycle_number,
                required_points__gt=user_level.current_cycle_points,
                is_active=True
            ).exclude(id__in=user_medal_ids).order_by('required_points')[:3]
            
            for medal in next_medals:
                # Contenido que desbloquea esta medalla
                medal_content = UnlockableEducationalContent.objects.filter(
                    unlock_type='MEDAL',
                    required_medal=medal,
                    is_active=True
                ).exclude(id__in=user_unlocked_ids)
                
                for content in medal_content:
                    points_needed = max(0, medal.required_points - user_level.current_cycle_points)
                    locked_content.append({
                        'title': content.title,
                        'summary': content.summary,
                        'unlock_requirement': f"Medalla: {medal.name}",
                        'points_needed': points_needed
                    })
        
        return locked_content[:5]  # Máximo 5 para preview
    
    @staticmethod
    def mark_content_as_read(user, content_access_id, reading_percentage=100):
        """
        SIMPLE: Marca contenido como leído
        """
        try:
            access = UserContentAccess.objects.get(
                id=content_access_id, 
                user=user
            )
            
            # Actualizar estado de lectura
            access.read_percentage = reading_percentage
            access.read_count += 1
            access.last_read_at = timezone.now()
            
            # Marcar como leído si leyó al menos 80%
            if reading_percentage >= 80:
                access.is_read = True
                if not access.first_read_at:
                    access.first_read_at = timezone.now()
            
            access.save()
            
            # Registrar sesión de lectura (opcional)
            try:
                UserReadingSession.objects.create(
                    user=user,
                    content_access=access,
                    time_spent_seconds=0,
                    scroll_percentage=reading_percentage,
                    completed_reading=reading_percentage >= 80
                )
            except Exception as e:
                # Si falla el registro de sesión, no importa
                print(f"Error registrando sesión: {e}")
            
            return access
            
        except UserContentAccess.DoesNotExist:
            print(f"ContentAccess {content_access_id} no existe para user {user.id}")
            return None
        except Exception as e:
            print(f"Error marcando como leído: {e}")
            return None