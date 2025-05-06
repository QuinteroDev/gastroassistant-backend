# users/views.py
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.db.utils import IntegrityError

# users/views.py - Updated register_user view

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

    # Validaciones básicas
    if not username or not email or not password:
        return Response({'error': 'Todos los campos son obligatorios'}, status=400)
    
    # Validación de email
    if '@' not in email:
        return Response({'error': 'Por favor, introduce un correo electrónico válido'}, status=400)
        
    # Validación de contraseña
    if len(password) < 6:
        return Response({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)

    try:
        # Comprobar si el usuario ya existe antes de intentar crearlo
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Este nombre de usuario ya está en uso'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Este correo electrónico ya está registrado'}, status=400)
            
        # Crear el usuario
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),  # encripta la contraseña
        )

        # Generar un token
        token, _ = Token.objects.get_or_create(user=user)

        # Crear perfil de usuario si no existe
        from profiles.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        return Response({
            'message': 'Usuario creado correctamente',
            'token': token.key,
            'username': user.username
        }, status=201)
    except IntegrityError as e:
        # Log detallado para depuración
        print(f"Error de integridad: {str(e)}")
        
        # Mensaje de error más específico
        if 'username' in str(e).lower():
            return Response({'error': 'Este nombre de usuario ya está en uso'}, status=400)
        elif 'email' in str(e).lower():
            return Response({'error': 'Este correo electrónico ya está registrado'}, status=400)
        else:
            return Response({'error': 'Error al crear usuario'}, status=400)
    except Exception as e:
        # Log para depuración
        print(f"Error inesperado: {str(e)}")
        return Response({'error': 'Error inesperado al procesar la solicitud'}, status=500)


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
        
        # Verificar si el usuario tiene un perfil
        has_profile = hasattr(user, 'profile')
        
        # Si tiene perfil, verificar si ha completado el onboarding
        if has_profile:
            onboarding_complete = user.profile.onboarding_complete
            print(f"Perfil existe, onboarding_complete: {onboarding_complete}")
            
            # Verificar si tiene un programa asignado
            has_program = hasattr(user, 'assigned_program')
            program_info = None
            
            if has_program:
                program = user.assigned_program.program
                print(f"Usuario tiene programa: {program.name}")
                program_info = {
                    "id": program.id,
                    "name": program.name,
                    "type": program.type
                }
            
            return Response({
                'token': token.key,
                'has_profile': has_profile,
                'onboarding_complete': onboarding_complete,
                'has_program': has_program,
                'program': program_info
            }, status=200)
        else:
            # Si no tiene perfil, devolver solo el token
            return Response({
                'token': token.key,
                'has_profile': False,
                'onboarding_complete': False,
                'has_program': False
            }, status=200)
    else:
        print(f"Credenciales incorrectas para {username}")
        return Response({'detail': 'Credenciales inválidas'}, status=401)