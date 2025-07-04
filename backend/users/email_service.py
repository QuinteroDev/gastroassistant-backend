# users/email_service.py

import resend
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Servicio para enviar emails usando Resend"""
    
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY
    
    def send_password_reset_email(self, user_email, username, reset_token):
        """Envía email de reset de contraseña"""
        
        # URL de reset (ajustar según tu configuración)
        reset_url = f"gastroassistant://reset-password?token={reset_token}"
        
        # Contenido del email en HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restablecer contraseña - Gastro Assistant</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .logo {{ color: #007bff; font-size: 24px; font-weight: bold; }}
                .content {{ line-height: 1.6; color: #333; }}
                .button {{ display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }}
                .warning {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Gastro Assistant</div>
                </div>
                
                <div class="content">
                    <h2>Restablecer tu contraseña</h2>
                    
                    <p>Hola <strong>{username}</strong>,</p>
                    
                    <p>Has solicitado restablecer tu contraseña en Gastro Assistant.</p>
                    
                    <p>Para crear una nueva contraseña, toca el siguiente botón desde tu dispositivo móvil:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Restablecer Contraseña</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ Importante:</strong> Este enlace es válido por <strong>1 hora</strong> únicamente.
                    </div>
                    
                    
                    <p>Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.</p>
                    
                    <p>¡Gracias por usar Gastro Assistant!</p>
                </div>
                
                <div class="footer">
                    <p>Este email fue enviado automáticamente, por favor no respondas.</p>
                    <p>© 2025 Gastro Assistant - Tu compañero para el bienestar digestivo</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Contenido en texto plano como fallback
        text_content = f"""
        Hola {username},

        Has solicitado restablecer tu contraseña en Gastro Assistant.

        Para continuar, copia y pega el siguiente enlace en tu navegador desde tu dispositivo móvil:
        {reset_url}

        Este enlace es válido por 1 hora únicamente.

        Si no has solicitado este cambio, puedes ignorar este mensaje.

        ¡Gracias por usar Gastro Assistant!
        
        ---
        Este email fue enviado automáticamente, por favor no respondas.
        © 2025 Gastro Assistant
        """
        
        try:
            params = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [user_email],
                "subject": "Gastro Assistant - Restablecer tu contraseña",
                "html": html_content,
                "text": text_content,
            }
            
            result = resend.Emails.send(params)
            logger.info(f"Email enviado exitosamente a {user_email}. ID: {result.get('id')}")
            return True, result
            
        except Exception as e:
            logger.error(f"Error enviando email a {user_email}: {str(e)}")
            return False, str(e)