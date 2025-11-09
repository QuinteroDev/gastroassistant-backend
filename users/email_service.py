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
        
        # 🔧 CAMBIO IMPORTANTE: Usar URL web que redirige al deep link
        # Esta URL abrirá una página web que automáticamente redirigirá a la app
        reset_url = f"{settings.FRONTEND_URL}/api/users/reset-password/?token={reset_token}"
        
        # Contenido del email en HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restablecer contraseña - Gastro Assistant</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🔐</div>
                    <h1 style="color: white; margin: 0; font-size: 28px;">Gastro Assistant</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-top: 0;">Restablecer tu contraseña</h2>
                    
                    <p style="color: #555; line-height: 1.6; font-size: 16px;">
                        Hola <strong>{username}</strong>,
                    </p>
                    
                    <p style="color: #555; line-height: 1.6; font-size: 16px;">
                        Has solicitado restablecer tu contraseña en Gastro Assistant.
                    </p>
                    
                    <p style="color: #555; line-height: 1.6; font-size: 16px;">
                        Para crear una nueva contraseña, toca el siguiente botón:
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="{reset_url}" 
                           style="display: inline-block; 
                                  background-color: #007bff; 
                                  color: white; 
                                  padding: 16px 40px; 
                                  text-decoration: none; 
                                  border-radius: 8px;
                                  font-weight: bold;
                                  font-size: 18px;
                                  box-shadow: 0 4px 6px rgba(0, 123, 255, 0.3);">
                            ✨ Restablecer Contraseña
                        </a>
                    </div>
                    
                    <!-- Warning Box -->
                    <div style="background-color: #fff3cd; 
                                border-left: 4px solid #ffc107; 
                                padding: 15px 20px; 
                                margin: 25px 0;
                                border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>⏰ Importante:</strong> Este enlace es válido por <strong>1 hora</strong> únicamente.
                        </p>
                    </div>
                    
                    <!-- Alternative Link -->
                    <div style="background-color: #f8f9fa; 
                                padding: 20px; 
                                border-radius: 8px; 
                                margin: 25px 0;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                            <strong>¿El botón no funciona?</strong>
                        </p>
                        <p style="margin: 0; color: #666; font-size: 13px; word-break: break-all;">
                            Copia y pega este enlace en tu navegador:<br>
                            <a href="{reset_url}" style="color: #007bff;">{reset_url}</a>
                        </p>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6; font-size: 16px;">
                        Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.
                    </p>
                    
                    <p style="color: #555; line-height: 1.6; font-size: 16px;">
                        ¡Gracias por usar Gastro Assistant! 💙
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; 
                            padding: 30px 20px; 
                            text-align: center; 
                            border-top: 1px solid #dee2e6;">
                    <p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">
                        Este email fue enviado automáticamente, por favor no respondas.
                    </p>
                    <p style="margin: 0; color: #999; font-size: 12px;">
                        © 2025 Gastro Assistant - Tu compañero para el bienestar digestivo
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Contenido en texto plano como fallback
        text_content = f"""
Hola {username},

Has solicitado restablecer tu contraseña en Gastro Assistant.

Para crear una nueva contraseña, abre el siguiente enlace en tu navegador:
{reset_url}

⏰ IMPORTANTE: Este enlace es válido por 1 hora únicamente.

Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.

¡Gracias por usar Gastro Assistant!

---
Este email fue enviado automáticamente, por favor no respondas.
© 2025 Gastro Assistant
        """
        
        try:
            params = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [user_email],
                "subject": "🔐 Gastro Assistant - Restablecer tu contraseña",
                "html": html_content,
                "text": text_content,
            }
            
            result = resend.Emails.send(params)
            logger.info(f"✅ Email enviado exitosamente a {user_email}. ID: {result.get('id')}")
            return True, result
            
        except Exception as e:
            logger.error(f"❌ Error enviando email a {user_email}: {str(e)}")
            return False, str(e)