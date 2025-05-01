import os
from pathlib import Path

# 1) Importa load_dotenv para leer variables de entorno
from dotenv import load_dotenv

# 2) Construye la ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# 3) Carga el archivo .env ubicado en la carpeta raíz (BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, '.env'))

# -----------------------------------------------------------
# VARIABLES GLOBALES LEÍDAS DESDE .env
# -----------------------------------------------------------
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-key-de-emergencia')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# ALLOWED_HOSTS se cargará como una lista (split por comas)
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Configuración de la BD
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'gastro'),
        'USER': os.getenv('DB_USER', 'quinterodev'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# 4) Resto de Settings de Django
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Django REST Framework
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Aquí añadirás tus apps, por ejemplo:
     'users',
     'profiles',
     'questionnaires',
     'programs',
     'recommendations',
     'habits',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'corsheaders.middleware.CorsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True 

ROOT_URLCONF = 'gastro_assistant.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # Aquí podrías agregar plantillas personalizadas
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'gastro_assistant.wsgi.application'

# Validadores de contraseñas
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Idioma y Zona Horaria
LANGUAGE_CODE = os.getenv('LANGUAGE_CODE', 'en-us')
TIME_ZONE = os.getenv('TIME_ZONE', 'UTC')

USE_I18N = True
USE_L10N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', 
    ],
}


# Configuración específica para JWT y Token Authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # Mantén un solo sistema de autenticación principal para evitar confusiones
        'rest_framework.authentication.TokenAuthentication',
        # Puedes conservar SessionAuthentication para el admin de Django
        'rest_framework.authentication.SessionAuthentication',
        # Si no estás usando JWT, comenta esta línea
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', 
    ],
}

# Configuración para CSRF si usas peticiones desde un frontend separado
CSRF_TRUSTED_ORIGINS = ['http://localhost:19006', 'http://192.168.1.48:19006']
CSRF_COOKIE_SAMESITE = 'Lax'  # En producción con HTTPS, usar 'None'
SESSION_COOKIE_SAMESITE = 'Lax'  # En producción con HTTPS, usar 'None'

# Si estás en desarrollo sin HTTPS
CSRF_COOKIE_SECURE = False  # En producción con HTTPS, usar True
SESSION_COOKIE_SECURE = False  # En producción con HTTPS, usar True

# Configuración de URLs de archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')  # Para collectstatic