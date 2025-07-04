# ========================================
# 3. users/views.py - VERSIÓN CORREGIDA COMPLETA
# ========================================

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password, check_password
from django.db.utils import IntegrityError
from django.conf import settings
from .models import PasswordResetToken  # ← IMPORTANTE: Import del modelo
from .email_service import EmailService  # ← IMPORTANTE: Import del servicio

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Registra un nuevo usuario y retorna un token.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Validaciones básicas
    if not username or not email or not password:
        return Response({'error': 'Todos los campos son obligatorios'}, status=400)
    
    if '@' not in email:
        return Response({'error': 'Por favor, introduce un correo electrónico válido'}, status=400)
        
    if len(password) < 6:
        return Response({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)

    try:
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Este nombre de usuario ya está en uso'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Este correo electrónico ya está registrado'}, status=400)
            
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
        )

        token, _ = Token.objects.get_or_create(user=user)

        from profiles.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        return Response({
            'message': 'Usuario creado correctamente',
            'token': token.key,
            'username': user.username
        }, status=201)
    except IntegrityError as e:
        print(f"Error de integridad: {str(e)}")
        return Response({'error': 'Error al crear usuario'}, status=400)
    except Exception as e:
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
        
        has_profile = hasattr(user, 'profile')
        
        if has_profile:
            onboarding_complete = user.profile.onboarding_complete
            print(f"Perfil existe, onboarding_complete: {onboarding_complete}")
            
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
            return Response({
                'token': token.key,
                'has_profile': False,
                'onboarding_complete': False,
                'has_program': False
            }, status=200)
    else:
        print(f"Credenciales incorrectas para {username}")
        return Response({'detail': 'Credenciales inválidas'}, status=401)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Cambia la contraseña del usuario autenticado."""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not current_password or not new_password or not confirm_password:
        return Response({'error': 'Todos los campos son obligatorios'}, status=400)
    
    if not check_password(current_password, user.password):
        return Response({'error': 'La contraseña actual es incorrecta'}, status=400)
    
    if new_password != confirm_password:
        return Response({'error': 'Las nuevas contraseñas no coinciden'}, status=400)
    
    if len(new_password) < 6:
        return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}, status=400)
    
    if check_password(new_password, user.password):
        return Response({'error': 'La nueva contraseña debe ser diferente a la actual'}, status=400)
    
    try:
        user.password = make_password(new_password)
        user.save()
        return Response({'message': 'Contraseña cambiada exitosamente'}, status=200)
    except Exception as e:
        print(f"Error al cambiar contraseña: {str(e)}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Solicita un reset de contraseña enviando un email con token."""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'El campo email es obligatorio'}, status=400)
    
    if '@' not in email or '.' not in email:
        return Response({'error': 'Por favor, introduce un email válido'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        
        # Invalidar tokens anteriores
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        
        # Crear nuevo token
        reset_token = PasswordResetToken.objects.create(user=user)
        
        # Enviar email
        email_service = EmailService()
        success, result = email_service.send_password_reset_email(
            user_email=email,
            username=user.username,
            reset_token=str(reset_token.token)
        )
        
        if success:
            print(f"✅ Email enviado exitosamente a {email}")
            response_data = {
                'message': 'Se ha enviado un email con las instrucciones para restablecer tu contraseña'
            }
            
            if settings.DEBUG:
                response_data['debug_info'] = {
                    'token': str(reset_token.token),
                    'email_id': result.get('id') if isinstance(result, dict) else None
                }
            
            return Response(response_data, status=200)
        else:
            print(f"❌ Error enviando email: {result}")
            return Response({'error': 'Error al enviar el email. Inténtalo más tarde.'}, status=500)
    
    except User.DoesNotExist:
        print(f"⚠️ Intento de reset para email no registrado: {email}")
        return Response({
            'message': 'Si el email está registrado, recibirás las instrucciones para restablecer tu contraseña'
        }, status=200)
    
    except Exception as e:
        print(f"💥 Error en request_password_reset: {str(e)}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """Confirma el reset de contraseña con el token."""
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not token or not new_password or not confirm_password:
        return Response({'error': 'Todos los campos son obligatorios'}, status=400)
    
    if new_password != confirm_password:
        return Response({'error': 'Las contraseñas no coinciden'}, status=400)
    
    if len(new_password) < 6:
        return Response({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)
    
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
        
        if not reset_token.is_valid():
            return Response({'error': 'El enlace ha expirado o ya ha sido usado'}, status=400)
        
        user = reset_token.user
        user.password = make_password(new_password)
        user.save()
        
        reset_token.used = True
        reset_token.save()
        
        # Invalidar todas las sesiones del usuario
        Token.objects.filter(user=user).delete()
        
        return Response({'message': 'Contraseña cambiada exitosamente'}, status=200)
        
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Token inválido'}, status=400)
    
    except Exception as e:
        print(f"Error en confirm_password_reset: {str(e)}")
        return Response({'error': 'Error interno del servidor'}, status=500)