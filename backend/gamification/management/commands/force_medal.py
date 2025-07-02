# gamification/management/commands/force_medal.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from gamification.models import Medal, UserMedal, UserLevel
from gamification.services import GamificationService

User = get_user_model()

class Command(BaseCommand):
    help = 'Forzar que un usuario gane una medalla específica para testing'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username del usuario')
        parser.add_argument(
            '--medal', 
            type=str, 
            help='Nombre de la medalla a otorgar (opcional)',
            default=None
        )
        parser.add_argument(
            '--points', 
            type=int, 
            help='Puntos a agregar al usuario',
            default=0
        )
        parser.add_argument(
            '--reset-medals', 
            action='store_true',
            help='Resetear todas las medallas del usuario'
        )
        parser.add_argument(
            '--list-medals', 
            action='store_true',
            help='Listar medallas disponibles'
        )

    def handle(self, *args, **options):
        username = options['username']
        
        # Listar medallas disponibles
        if options['list_medals']:
            self.list_available_medals()
            return
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Usuario "{username}" no encontrado')
            )
            return

        user_level = GamificationService.get_or_create_user_level(user)
        
        # Resetear medallas si se solicita
        if options['reset_medals']:
            deleted_count = UserMedal.objects.filter(user=user).count()
            UserMedal.objects.filter(user=user).delete()
            self.stdout.write(
                self.style.SUCCESS(f'🗑️ {deleted_count} medallas eliminadas para {username}')
            )
        
        # Agregar puntos si se solicita
        if options['points'] > 0:
            user_level.current_cycle_points += options['points']
            user_level.save()
            self.stdout.write(
                self.style.SUCCESS(f'⬆️ +{options["points"]} puntos agregados. Total: {user_level.current_cycle_points}')
            )
        
        # Forzar medalla específica
        if options['medal']:
            self.force_specific_medal(user, options['medal'])
        else:
            # Verificar medallas automáticamente
            self.check_and_award_medals(user)
        
        # Mostrar estado actual
        self.show_user_status(user)

    def list_available_medals(self):
        self.stdout.write(self.style.SUCCESS('\n🏆 MEDALLAS DISPONIBLES:'))
        medals = Medal.objects.filter(is_active=True).order_by('required_level', 'required_points')
        
        for medal in medals:
            self.stdout.write(f'  • {medal.name} ({medal.required_level}) - {medal.required_points} pts')
            self.stdout.write(f'    "{medal.description}"')
        self.stdout.write('')

    def force_specific_medal(self, user, medal_name):
        try:
            medal = Medal.objects.get(name__icontains=medal_name, is_active=True)
        except Medal.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Medalla "{medal_name}" no encontrada')
            )
            self.list_available_medals()
            return
        except Medal.MultipleObjectsReturned:
            medals = Medal.objects.filter(name__icontains=medal_name, is_active=True)
            self.stdout.write(
                self.style.ERROR(f'❌ Múltiples medallas encontradas con "{medal_name}":')
            )
            for m in medals:
                self.stdout.write(f'  • {m.name}')
            return

        # Verificar si ya tiene la medalla
        if UserMedal.objects.filter(user=user, medal=medal).exists():
            self.stdout.write(
                self.style.WARNING(f'⚠️ El usuario ya tiene la medalla "{medal.name}"')
            )
            return

        # Asegurar que tenga suficientes puntos
        user_level = GamificationService.get_or_create_user_level(user)
        if user_level.current_cycle_points < medal.required_points:
            needed_points = medal.required_points - user_level.current_cycle_points
            user_level.current_cycle_points = medal.required_points
            user_level.save()
            self.stdout.write(
                self.style.SUCCESS(f'⬆️ Puntos ajustados: +{needed_points} (Total: {medal.required_points})')
            )

        # Crear la medalla
        if user_level.current_cycle:
            user_medal = UserMedal.objects.create(
                user=user,
                medal=medal,
                cycle_earned=user_level.current_cycle,
                points_when_earned=user_level.current_cycle_points,
                level_when_earned=user_level.current_level
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'🎉 ¡Medalla "{medal.name}" otorgada a {user.username}!')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'❌ El usuario no tiene un ciclo activo')
            )

    def check_and_award_medals(self, user):
        self.stdout.write(f'\n🔍 Verificando medallas para {user.username}...')
        
        # Forzar verificación de medallas
        new_medals = GamificationService.check_new_medals(user)
        
        if new_medals:
            self.stdout.write(
                self.style.SUCCESS(f'🎉 ¡{len(new_medals)} nueva(s) medalla(s) otorgada(s)!')
            )
            for user_medal in new_medals:
                self.stdout.write(f'  🏆 {user_medal.medal.name}')
        else:
            self.stdout.write(
                self.style.WARNING('⚠️ No se encontraron nuevas medallas elegibles')
            )
            
            # Mostrar próximas medallas disponibles
            user_level = GamificationService.get_or_create_user_level(user)
            earned_medal_ids = UserMedal.objects.filter(user=user).values_list('medal_id', flat=True)
            
            next_medals = Medal.objects.filter(
                is_active=True,
                required_points__gt=user_level.current_cycle_points
            ).exclude(id__in=earned_medal_ids).order_by('required_points')[:3]
            
            if next_medals:
                self.stdout.write('\n🎯 PRÓXIMAS MEDALLAS:')
                for medal in next_medals:
                    points_needed = medal.required_points - user_level.current_cycle_points
                    self.stdout.write(f'  • {medal.name} - Faltan {points_needed} puntos')

    def show_user_status(self, user):
        user_level = GamificationService.get_or_create_user_level(user)
        user_medals = UserMedal.objects.filter(user=user).count()
        
        self.stdout.write(f'\n📊 ESTADO DE {user.username}:')
        self.stdout.write(f'  • Nivel: {user_level.current_level}')
        self.stdout.write(f'  • Puntos: {user_level.current_cycle_points}')
        self.stdout.write(f'  • Racha: {user_level.current_streak} días')
        self.stdout.write(f'  • Medallas: {user_medals}')
        if user_level.current_cycle:
            self.stdout.write(f'  • Ciclo: {user_level.current_cycle.cycle_number}')
        self.stdout.write('')