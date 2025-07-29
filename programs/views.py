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
        
        # Determinar qué bloque específico mostrar dentro del programa
        if instance.program.type == 'A':
            # Escenarios A, J → ERGE erosiva
            profile_data['display_block'] = 1
        elif instance.program.type == 'B':
            # Programas tipo B pueden ser bloque 2 o 9
            if profile.phenotype == 'NERD_MIXED' or profile.scenario == 'M':
                profile_data['display_block'] = 9  # 🆕 NERD Mixto
            else:
                profile_data['display_block'] = 2  # NERD regular
        elif instance.program.type == 'C':
            # Escenarios C, L → Reflujo extraesofágico
            profile_data['display_block'] = 3
        elif instance.program.type == 'D':
            # Programas tipo D pueden ser bloque 4, 5, 6, 7 u 8
            if profile.phenotype == 'FUNCTIONAL' or profile.scenario == 'D':
                profile_data['display_block'] = 4  # Perfil funcional (solo D)
            elif profile.phenotype == 'SYMPTOMS_NO_TESTS' or profile.scenario == 'E':
                profile_data['display_block'] = 5  # Síntomas digestivos sin pruebas
            elif profile.phenotype == 'EXTRAESOPHAGEAL_NO_TESTS' or profile.scenario == 'F':
                profile_data['display_block'] = 7  # Síntomas extraesofágicos sin pruebas
            elif profile.phenotype == 'SYMPTOMS_MIXED_NO_TESTS' or profile.scenario == 'G':
                profile_data['display_block'] = 8  # Síntomas mixtos sin pruebas
            elif profile.phenotype == 'NO_SYMPTOMS' or profile.scenario in ['H', 'I']:
                profile_data['display_block'] = 6  # Sin síntomas (H e I)
        
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


