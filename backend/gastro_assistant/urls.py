# gastro_assistant/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # URLs de autenticación (registro/login)
    path('api/users/', include('users.urls')),
    
    # URLs de perfiles
    path('api/profiles/', include('profiles.urls')),
    
    # URLs de cuestionarios
    path('api/questionnaires/', include('questionnaires.urls')),
    
    # Endpoints de programas de tratamiento
    path('api/programs/', include('programs.urls')),  
    
    path('api/recommendations/', include('recommendations.urls')),  
    
    path('api/habits/', include('habits.urls')),  #

    path('api/cycles/', include('cycles.urls')),

    path('api/gamification/', include('gamification.urls')),  # ← AÑADIR ESTA LÍNEA

    path('api/learn/', include('learn.urls')), 

]