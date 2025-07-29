# conftest.py (en la raíz del proyecto)
import os
import sys
import django
from django.conf import settings

# Agregar el directorio del proyecto al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configurar Django antes de cualquier import
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gastro_assistant.settings')  # ← CAMBIAR A TU SETTINGS REAL

# Configurar Django
if not settings.configured:
    django.setup()

# Ahora sí podemos importar pytest y configuraciones
import pytest

# Configurar pytest-django
pytest_plugins = ['pytest_django']