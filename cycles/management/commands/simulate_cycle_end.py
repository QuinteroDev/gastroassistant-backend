# cycles/management/commands/simulate_cycle_end.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cycles.models import UserCycle

class Command(BaseCommand):
    help = 'Simula que han pasado 30 días para un usuario'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username del usuario')
        parser.add_argument(
            '--days', 
            type=int, 
            default=30,
            help='Número de días a simular (default: 30)'
        )

    def handle(self, *args, **options):
        username = options['username']
        days = options['days']
        
        try:
            user = User.objects.get(username=username)
            cycle = UserCycle.objects.filter(
                user=user,
                status='ACTIVE'
            ).first()
            
            if not cycle:
                self.stdout.write(
                    self.style.ERROR(f'No se encontró ciclo activo para {username}')
                )
                return
            
            # Actualizar fechas del ciclo
            cycle.start_date = timezone.now() - timedelta(days=days)
            cycle.end_date = cycle.start_date + timedelta(days=30)
            cycle.save()
            
            # Verificar y actualizar estado
            cycle.check_and_update_status()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Ciclo actualizado para {username}:\n'
                    f'- Inicio: {cycle.start_date}\n'
                    f'- Fin: {cycle.end_date}\n'
                    f'- Estado: {cycle.status}\n'
                    f'- Días transcurridos: {cycle.days_elapsed}\n'
                    f'- Días restantes: {cycle.days_remaining}'
                )
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Usuario {username} no encontrado')
            )