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
from django.utils import timezone


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
        # Intentar convertir el token a UUID primero
        import uuid
        try:
            token_uuid = uuid.UUID(token)
        except ValueError:
            return Response({'error': 'Token inválido'}, status=400)
        
        # Buscar el token
        reset_token = PasswordResetToken.objects.get(token=token_uuid)
        
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
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Elimina (desactiva) la cuenta del usuario autenticado.
    Soft delete: marca el usuario como inactivo y anonimiza datos sensibles.
    """
    user = request.user
    password = request.data.get('password')
    
    # Validar que envió la contraseña para confirmar
    if not password:
        return Response({
            'error': 'Debes confirmar tu contraseña para eliminar la cuenta'
        }, status=400)
    
    # Verificar que la contraseña sea correcta
    if not check_password(password, user.password):
        return Response({
            'error': 'Contraseña incorrecta'
        }, status=400)
    
    try:
        # Guardar username antes de modificar
        original_username = user.username
        
        # Anonimizar datos del usuario
        user.username = f"deleted_user_{user.id}_{int(timezone.now().timestamp())}"
        user.email = f"deleted_{user.id}@deleted.com"
        user.is_active = False
        user.save()
        
        # Eliminar el token de autenticación
        Token.objects.filter(user=user).delete()
        
        print(f"✅ Usuario {original_username} (ID: {user.id}) desactivado exitosamente")
        
        return Response({
            'message': 'Tu cuenta ha sido eliminada exitosamente'
        }, status=200)
        
    except Exception as e:
        print(f"❌ Error al eliminar cuenta: {str(e)}")
        return Response({
            'error': 'Error al procesar la eliminación de la cuenta'
        }, status=500)
    
# Añade esta función al final de users/views.py

from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([AllowAny])
def reset_password_redirect(request):
    """
    Vista web que recibe el token del email y redirige al deep link de la app.
    Esta página se abre cuando el usuario toca el botón en el email.
    """
    token = request.GET.get('token')
    
    if not token:
        return HttpResponse("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error - Gastro Assistant</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        max-width: 400px;
                        text-align: center;
                    }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { color: #dc3545; margin: 0 0 15px 0; font-size: 24px; }
                    p { color: #666; line-height: 1.6; margin: 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">❌</div>
                    <h1>Enlace inválido</h1>
                    <p>Este enlace no es válido. Por favor, solicita un nuevo enlace de recuperación desde la app.</p>
                </div>
            </body>
            </html>
        """, status=400)
    
    # Verificar que el token existe y es válido
    try:
        import uuid
        token_uuid = uuid.UUID(token)
        reset_token = PasswordResetToken.objects.get(token=token_uuid)
        
        if not reset_token.is_valid():
            return HttpResponse("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Enlace expirado - Gastro Assistant</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 16px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            max-width: 400px;
                            text-align: center;
                        }
                        .icon { font-size: 64px; margin-bottom: 20px; }
                        h1 { color: #ffc107; margin: 0 0 15px 0; font-size: 24px; }
                        p { color: #666; line-height: 1.6; margin: 0 0 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">⏰</div>
                        <h1>Enlace expirado</h1>
                        <p>Este enlace ha expirado o ya ha sido usado.</p>
                        <p><strong>Por favor, solicita un nuevo enlace desde la app.</strong></p>
                    </div>
                </body>
                </html>
            """, status=400)
            
    except (ValueError, PasswordResetToken.DoesNotExist):
        return HttpResponse("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Token inválido - Gastro Assistant</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        max-width: 400px;
                        text-align: center;
                    }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { color: #dc3545; margin: 0 0 15px 0; font-size: 24px; }
                    p { color: #666; line-height: 1.6; margin: 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">🚫</div>
                    <h1>Token inválido</h1>
                    <p>Por favor, solicita un nuevo enlace de recuperación desde la app.</p>
                </div>
            </body>
            </html>
        """, status=400)
    
    # Deep link de tu app - este esquema debe coincidir con el configurado en React Native
    deep_link = f"gastroassistant://reset-password?token={token}"
    
    # HTML con redirección automática y fallback manual
    return HttpResponse(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Abriendo Gastro Assistant...</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    max-width: 400px;
                    text-align: center;
                }}
                .icon {{ font-size: 64px; margin-bottom: 20px; }}
                h1 {{ 
                    color: #333; 
                    margin: 0 0 20px 0; 
                    font-size: 24px; 
                }}
                p {{ 
                    color: #666; 
                    line-height: 1.6; 
                    margin: 0 0 20px 0; 
                }}
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                    margin: 10px 0;
                    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);
                    transition: transform 0.2s;
                }}
                .button:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.5);
                }}
                .spinner {{
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }}
                @keyframes spin {{
                    0% {{ transform: rotate(0deg); }}
                    100% {{ transform: rotate(360deg); }}
                }}
                .note {{
                    font-size: 13px;
                    color: #999;
                    margin-top: 20px;
                }}
            </style>
            <script>
                // Intentar abrir la app automáticamente al cargar la página
                window.onload = function() {{
                    // Redirigir al deep link inmediatamente
                    window.location.href = '{deep_link}';
                    
                    // Después de 2.5 segundos, mostrar el botón manual por si no funcionó
                    setTimeout(function() {{
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('manual').style.display = 'block';
                    }}, 2500);
                }};
                
                // Función para reintentar abrir la app
                function openApp() {{
                    window.location.href = '{deep_link}';
                }}
            </script>
        </head>
        <body>
            <div class="container">
                <div class="icon">🔐</div>
                
                <!-- Estado de carga -->
                <div id="loading">
                    <h1>Abriendo Gastro Assistant...</h1>
                    <div class="spinner"></div>
                    <p>Por favor, espera un momento mientras abrimos la aplicación</p>
                </div>
                
                <!-- Fallback manual -->
                <div id="manual" style="display: none;">
                    <h1>¿No se abrió la app?</h1>
                    <p>No te preocupes, toca el botón para abrir Gastro Assistant:</p>
                    <a href="{deep_link}" class="button" onclick="openApp(); return true;">
                        📱 Abrir Gastro Assistant
                    </a>
                    <p class="note">
                        Si el botón no funciona, asegúrate de tener la app instalada en tu dispositivo.
                    </p>
                </div>
            </div>
        </body>
        </html>
    """)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Devuelve info del usuario autenticado para verificar sesión al abrir la app.
    """
    user = request.user
    has_profile = hasattr(user, 'profile')
    
    return Response({
        'username': user.username,
        'has_profile': has_profile,
        'onboarding_complete': user.profile.onboarding_complete if has_profile else False,
    })