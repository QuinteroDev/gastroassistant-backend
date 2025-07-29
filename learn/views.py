# learn/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import UserContentAccess
from .services import ContentUnlockService
from .serializers import UserContentAccessSerializer

class LearnDashboardView(APIView):
    """
    Dashboard completo de contenidos - TODO EN UNO
    Devuelve tanto contenido disponible como bloqueado
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Verificar y desbloquear nuevo contenido automáticamente
        newly_unlocked = ContentUnlockService.check_and_unlock_content(request.user)
        
        # Obtener contenido disponible (estático + desbloqueado)
        available_content = ContentUnlockService.get_user_available_content(request.user)
        
        # Separar por tipo
        static_content = []
        unlocked_content = []
        
        for access in available_content:
            content_data = UserContentAccessSerializer(access).data
            if access.static_content:
                static_content.append(content_data)
            elif access.unlockable_content:
                unlocked_content.append(content_data)
        
        # NUEVO: Ordenar contenido por prioridad
        # Primero no leídos (ordenados por fecha más reciente)
        # Luego leídos (ordenados por fecha más reciente)
        def sort_content_by_priority(content_list):
            # Separar leídos y no leídos
            unread = [c for c in content_list if not c['is_read']]
            read = [c for c in content_list if c['is_read']]
            
            # Ordenar cada grupo por fecha de creación (más reciente primero)
            unread.sort(key=lambda x: x['content_data']['created_at'], reverse=True)
            read.sort(key=lambda x: x['content_data']['created_at'], reverse=True)
            
            # Combinar: primero no leídos, luego leídos
            return unread + read
        
        # Aplicar ordenamiento a ambas listas
        static_content = sort_content_by_priority(static_content)
        unlocked_content = sort_content_by_priority(unlocked_content)
        
        # Contenido bloqueado próximo a desbloquear (preview)
        locked_preview = ContentUnlockService.get_locked_content_preview(request.user)
        
        return Response({
            'static_content': static_content,
            'unlocked_content': unlocked_content,
            'locked_preview': locked_preview[:3],  # Solo los 3 más próximos
            'newly_unlocked_count': len(newly_unlocked),
            'stats': {
                'total_available': len(static_content) + len(unlocked_content),
                'total_read': available_content.filter(is_read=True).count(),
                'total_static': len(static_content),
                'total_unlocked': len(unlocked_content)
            }
        })

class MarkAsReadView(APIView):
    """
    Marcar contenido como leído
    Solo funcionalidad esencial
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, content_id):
        reading_percentage = request.data.get('reading_percentage', 100)
        
        try:
            reading_percentage = int(reading_percentage)
            if reading_percentage < 0 or reading_percentage > 100:
                raise ValueError()
        except ValueError:
            return Response({
                'error': 'reading_percentage debe ser un número entre 0 y 100'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        access = ContentUnlockService.mark_content_as_read(
            user=request.user,
            content_access_id=content_id,
            reading_percentage=reading_percentage
        )
        
        if access:
            return Response({
                'success': True,
                'is_read': access.is_read,
                'read_percentage': access.read_percentage
            })
        else:
            return Response({
                'error': 'Contenido no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)