# users/views.py
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.db.utils import IntegrityError

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Registra un nuevo usuario y retorna un token.
    Espera un JSON:
    {
      "username": "test",
      "email": "test@example.com",
      "password": "xxxxx"
    }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Validaciones sencillas
    if not username or not password:
        return Response({'error': 'Datos insuficientes'}, status=400)

    try:
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),  # encripta la contraseña
        )
        # Generar un token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'message': 'Usuario creado correctamente',
            'token': token.key,
        }, status=201)

    except IntegrityError:
        # Esto salta si el username ya existe, etc.
        return Response({'error': 'Usuario ya existente'}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Intento de login: usuario={username}")
    
    if not username or not password:
        return Response({'detail': 'Datos insuficientes'}, status=400)
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        token, _ = Token.objects.get_or_create(user=user)
        print(f"Login exitoso para {username}")
        
        # Si tienes un campo onboarding_completed en tu modelo de usuario
        onboarding_completed = getattr(user, 'onboarding_completed', False)
        
        return Response({
            'token': token.key,
            'onboarding_completed': onboarding_completed
        }, status=200)
    else:
        print(f"Credenciales incorrectas para {username}")
        return Response({'detail': 'Credenciales inválidas'}, status=401)