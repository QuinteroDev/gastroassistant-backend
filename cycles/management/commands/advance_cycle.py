# cycles/management/commands/advance_cycle.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.models import UserCycle
from cycles.services import CycleService

class Command(BaseCommand):
    help = 'Avanza el tiempo del ciclo de un usuario para testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            required=True,
            help='Username del usuario'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de días a avanzar (default: 30)'
        )
        parser.add_argument(
            '--complete',
            action='store_true',
            help='Marca el ciclo como pendiente de renovación directamente'
        )

    def handle(self, *args, **options):
        username = options['username']
        days = options['days']
        complete = options['complete']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Usuario {username} no encontrado'))
            return

        current_cycle = CycleService.get_current_cycle(user)
        
        if not current_cycle:
            self.stdout.write(self.style.ERROR('El usuario no tiene ciclo activo'))
            return

        self.stdout.write(f'\nCiclo actual:')
        self.stdout.write(f'  - Número: {current_cycle.cycle_number}')
        self.stdout.write(f'  - Estado: {current_cycle.status}')
        self.stdout.write(f'  - Inicio: {current_cycle.start_date}')
        self.stdout.write(f'  - Fin: {current_cycle.end_date}')
        self.stdout.write(f'  - Días transcurridos: {current_cycle.days_elapsed}')
        self.stdout.write(f'  - Días restantes: {current_cycle.days_remaining}')

        if complete:
            # Opción directa: marcar como pendiente de renovación
            current_cycle.status = 'PENDING_RENEWAL'
            current_cycle.save()
            self.stdout.write(self.style.SUCCESS(
                f'\n✓ Ciclo marcado como PENDING_RENEWAL'
            ))
        else:
            # Opción de retroceder las fechas
            time_travel = timedelta(days=days)
            
            # Ajustar las fechas del ciclo hacia atrás
            current_cycle.start_date -= time_travel
            current_cycle.end_date -= time_travel
            
            # Si tiene fecha de onboarding completado, también ajustarla
            if current_cycle.onboarding_completed_at:
                current_cycle.onboarding_completed_at -= time_travel
            
            current_cycle.save()
            
            # Verificar y actualizar el estado
            current_cycle.check_and_update_status()
            
            self.stdout.write(self.style.SUCCESS(
                f'\n✓ Ciclo retrocedido {days} días'
            ))

        # Mostrar estado actualizado
        current_cycle.refresh_from_db()
        self.stdout.write(f'\nCiclo actualizado:')
        self.stdout.write(f'  - Estado: {current_cycle.status}')
        self.stdout.write(f'  - Días transcurridos: {current_cycle.days_elapsed}')
        self.stdout.write(f'  - Días restantes: {current_cycle.days_remaining}')
        
        if CycleService.needs_new_cycle(user):
            self.stdout.write(self.style.WARNING(
                '\n⚠️  El usuario ahora necesita renovar su ciclo'
            ))