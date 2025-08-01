# programs/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserProgram, TreatmentProgram
from .serializers import UserProgramSerializer, TreatmentProgramSerializer
from programs.services import ProgramAssignmentService
from profiles.models import UserProfile


# programs/views.py - Actualizar UserProgramView


class UserProgramView(generics.RetrieveAPIView):
    """
    Vista para obtener el programa asignado al usuario actual
    con datos completos para la presentación frontend.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProgramSerializer
    
    def get_object(self):
        try:
            return UserProgram.objects.get(user=self.request.user)
        except UserProgram.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance:
            return Response(
                {"detail": "No tienes un programa asignado actualmente."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener datos del perfil para contexto adicional
        profile = request.user.profile
        
        # Crear metadatos específicos para personalización
        profile_data = {
            'phenotype': profile.phenotype,
            'scenario': profile.scenario,
            'has_hernia': profile.has_hernia,
            'has_altered_motility': profile.has_altered_motility,
            'has_slow_emptying': profile.has_slow_emptying,
            'has_dry_mouth': profile.has_dry_mouth,
            'has_constipation': profile.has_constipation,
            'stress_affects': profile.stress_affects,
            'bmi': profile.bmi,
            'has_excess_weight': profile.has_excess_weight,
            'display_block': None  # Se llenará según el caso
        }
        
        # Mapeo directo de escenarios a bloques según la nueva tabla
        scenario_to_block = {
            'A': 1,   # ERGE Erosiva
            'B': 9,   # NERD Mixto
            'C': 2,   # NERD
            'D': 3,   # Reflujo Extraesofágico
            'E': 6,   # Bienestar Digestivo (CAMBIADO)
            'F': 4,   # Perfil Funcional
            'F2': 4,  # Perfil Funcional
            'F3': 4,  # Perfil Funcional
            'F4': 6,  # Bienestar Digestivo
            'G': 8,   # Perfil Mixto sin Pruebas
            'H': 5,   # Síntomas Digestivos sin Pruebas
            'I': 7,   # Síntomas Extraesofágicos sin Pruebas
            'J': 6,   # Bienestar Digestivo
            'K': 8,   # Perfil Mixto sin Pruebas
            'L': 5,   # Síntomas Digestivos sin Pruebas
            'M': 7,   # Síntomas Extraesofágicos sin Pruebas
            'N': 6,   # Bienestar Digestivo
            'O': 8,   # Perfil Mixto sin Pruebas
            'P': 5,   # Síntomas Digestivos sin Pruebas
            'Q': 7,   # Síntomas Extraesofágicos sin Pruebas
            'R': 6,   # Bienestar Digestivo
        }
        
        # Determinar qué bloque mostrar basado en el escenario
        profile_data['display_block'] = scenario_to_block.get(profile.scenario, 6)
        
        # Serializar el programa
        serializer = self.get_serializer(instance)
        response_data = serializer.data
        
        # Añadir información del perfil
        response_data['profile_data'] = profile_data
        
        return Response(response_data)
    
class GenerateProgramView(APIView):
    """
    Vista para generar o regenerar el programa del usuario actual.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Asignar el programa basado en el fenotipo actual
        user_program = ProgramAssignmentService.assign_program(request.user)
        
        if user_program:
            return Response({
                "message": "Programa generado correctamente",
                "program": {
                    "id": user_program.program.id,
                    "name": user_program.program.name,
                    "type": user_program.program.type
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "No se pudo asignar un programa"
            }, status=status.HTTP_400_BAD_REQUEST)


