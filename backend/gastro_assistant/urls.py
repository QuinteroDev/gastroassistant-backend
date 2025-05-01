# gastro_assistant/urls.py
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),

    # URLs de autenticación (registro/login)
    path('api/users/', include('users.urls')), # Prefijo 'api/users/'

    # URLs de perfiles
    path('api/profiles/', include('profiles.urls')), # Prefijo 'api/profiles/'

    # URLs de cuestionarios
    path('api/questionnaires/', include('questionnaires.urls')), # Prefijo 'api/questionnaires/'

    # Endpoints de programas de tratamiento
    path('programs/', include('programs.urls')),

    path('recommendations/', include('recommendations.urls')),

    path('habits/', include('habits.urls')),





]