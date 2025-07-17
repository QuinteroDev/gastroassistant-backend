# cycles/management/commands/test_cycle.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from cycles.services import CycleService

class Command(BaseCommand):
    help = 'Crea un ciclo de prueba para un usuario'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username del usuario')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            cycle = CycleService.create_new_cycle(user)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Ciclo {cycle.cycle_number} creado para {username}'
                )
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Usuario {username} no encontrado')
            )