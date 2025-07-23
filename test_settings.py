# test_settings.py
import os
from pathlib import Path

# Importar todo de settings principal
from gastro_assistant.settings import *

# Sobrescribir la base de datos para usar SQLite en memoria
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Comentar esto temporalmente para que se ejecuten las migraciones
# class DisableMigrations:
#     def __contains__(self, item):
#         return True

#     def __getitem__(self, item):
#         return None

# MIGRATION_MODULES = DisableMigrations()

# Configuraciones para acelerar tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Desactivar caché
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Email backend para tests (no envía emails reales)
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Asegurar que RESEND no intente enviar emails en tests
RESEND_API_KEY = 'test-key'

# Desactivar CORS para tests
CORS_ALLOW_ALL_ORIGINS = False
ALLOWED_HOSTS = ['testserver']