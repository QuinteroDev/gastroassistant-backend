# profiles/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer
from profiles.services import PhenotypeClassificationService
from programs.services import ProgramAssignmentService
from questionnaires.models import QuestionnaireCompletion

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener (GET) y actualizar (PUT/PATCH)
    el perfil del usuario autenticado.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated] # Solo usuarios logueados

    def get_object(self):
        # Asegura que siempre se obtenga el perfil DEL USUARIO LOGUEADO
        # Asume que la signal ha creado el perfil al registrarse.
        # Si hay algún caso donde no exista, habría que manejarlo (get_or_create).
        return self.request.user.profile
    
class DiagnosticTestsUpdateView(APIView):
    """
    Vista para actualizar los resultados de pruebas diagnósticas (endoscopia, pH-metría)
    y recalcular el fenotipo del usuario.
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        profile = request.user.profile
        
        # Actualizar campos de pruebas diagnósticas
        has_endoscopy = request.data.get('has_endoscopy')
        endoscopy_result = request.data.get('endoscopy_result')
        has_ph_monitoring = request.data.get('has_ph_monitoring')
        ph_monitoring_result = request.data.get('ph_monitoring_result')
        
        # Validar y actualizar campos
        if has_endoscopy is not None:
            profile.has_endoscopy = has_endoscopy
        
        if endoscopy_result and endoscopy_result in [choice[0] for choice in UserProfile.ENDOSCOPY_CHOICES]:
            profile.endoscopy_result = endoscopy_result
        
        if has_ph_monitoring is not None:
            profile.has_ph_monitoring = has_ph_monitoring
        
        if ph_monitoring_result and ph_monitoring_result in [choice[0] for choice in UserProfile.PH_MONITORING_CHOICES]:
            profile.ph_monitoring_result = ph_monitoring_result
        
        # Guardar cambios
        profile.save()
        
        # Reclasificar al usuario y asignar nuevo programa si es necesario
        phenotype_result = PhenotypeClassificationService.classify_user(request.user)
        user_program = ProgramAssignmentService.assign_program(request.user)
        
        # Preparar respuesta
        response_data = UserProfileSerializer(profile).data
        response_data['phenotype_result'] = phenotype_result
        
        if user_program:
            response_data['program_assigned'] = {
                "id": user_program.program.id,
                "name": user_program.program.name,
                "type": user_program.program.type
            }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
class UserPhenotypeView(APIView):
    """
    Vista para obtener la información del fenotipo del usuario.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = request.user.profile
        
        # Obtener información del fenotipo
        phenotype_code = profile.phenotype
        scenario = profile.scenario
        
        # Mapear a nombres legibles
        phenotype_display = dict(UserProfile.PHENOTYPE_CHOICES).get(phenotype_code, "No determinado")
        
        # Preparar recomendaciones según el fenotipo
        recommendations = self.get_phenotype_recommendations(phenotype_code)
        
        response_data = {
            'phenotype_code': phenotype_code,
            'phenotype_display': phenotype_display,
            'scenario': scenario,
            'recommendations': recommendations,
            'has_complete_data': self.has_complete_diagnostic_data(profile)
        }
        
        return Response(response_data)
    
    def has_complete_diagnostic_data(self, profile):
        """Verifica si el usuario ha completado toda la información diagnóstica necesaria."""
        # Verificar cuestionarios
        gerdq_done = QuestionnaireCompletion.objects.filter(
            user=profile.user, 
            questionnaire__type='GERDQ'
        ).exists()
        
        rsi_done = QuestionnaireCompletion.objects.filter(
            user=profile.user, 
            questionnaire__type='RSI'
        ).exists()
        
        # Considerar completo si ha hecho al menos los cuestionarios y ha registrado 
        # si tiene o no pruebas diagnósticas
        return gerdq_done and rsi_done and (
            profile.has_endoscopy is not None and 
            profile.has_ph_monitoring is not None
        )
    
    def get_phenotype_recommendations(self, phenotype_code):
        """Retorna recomendaciones específicas según el fenotipo."""
        # Estas recomendaciones podrían venir de una base de datos o un modelo específico
        # Por ahora, usamos un diccionario simple
        recommendations = {
            'EROSIVE': [
                "Acude a tu médico para valorar tratamiento específico para ERGE erosiva.",
                "Evita alimentos ácidos, grasosos, chocolate y alcohol.",
                "Eleva la cabecera de la cama 15-20 cm.",
                "Mantén un peso saludable."
            ],
            'NERD': [
                "Evita comidas copiosas y acostarte inmediatamente después.",
                "Reduce el consumo de café, té, chocolate y alcohol.",
                "Considera un tratamiento con inhibidores de la bomba de protones según indicación médica.",
                "Practica técnicas de manejo del estrés."
            ],
            'EXTRAESOPHAGEAL': [
                "Consulta con un otorrinolaringólogo para valoración específica.",
                "Evita irritantes como tabaco, alcohol y alimentos picantes.",
                "Mantén una hidratación adecuada.",
                "No te acuestes hasta 2-3 horas después de cenar."
            ],
            'FUNCTIONAL': [
                "Los síntomas podrían deberse a hipersensibilidad esofágica.",
                "Consulta con un gastroenterólogo especializado.",
                "Pueden ser útiles terapias de neuromodulación o psicológicas.",
                "Mantén un diario de síntomas para identificar desencadenantes."
            ],
            'SYMPTOMS_NO_TESTS': [
                "Tus síntomas sugieren posible reflujo, pero no hay pruebas confirmatorias.",
                "Recomendamos consultar con un médico para valorar la necesidad de pruebas diagnósticas.",
                "Mientras tanto, evita comidas copiosas y acostarte inmediatamente después."
            ],
            'EXTRAESOPHAGEAL_NO_TESTS': [
                "Tus síntomas sugieren posible reflujo extraesofágico, pero no hay pruebas confirmatorias.",
                "Recomendamos consultar con un otorrinolaringólogo.",
                "Evita irritantes como tabaco y alcohol."
            ],
            'NO_SYMPTOMS': [
                "No se han detectado síntomas significativos de reflujo.",
                "Sigue hábitos de vida saludables para prevención."
            ],
            'UNDETERMINED': [
                "No hay suficiente información para determinar tu perfil.",
                "Completa los cuestionarios y la información sobre pruebas diagnósticas."
            ]
        }
        
        return recommendations.get(phenotype_code, ["Completa tu perfil para recibir recomendaciones personalizadas."])
    
class CompleteOnboardingView(APIView):
    """
    Vista para forzar la finalización del onboarding si hay algún problema.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        
        # Marcar onboarding como completo
        profile.onboarding_complete = True
        profile.save(update_fields=['onboarding_complete'])
        
        # Intentar asignar programa si no tiene uno
        from programs.services import ProgramAssignmentService
        
        # Verificar si ya tiene un programa asignado
        try:
            user_program = request.user.assigned_program
        except:
            # Si no tiene programa, asignar uno
            user_program = ProgramAssignmentService.assign_program(request.user)
        
        # Verificar si se creó el programa
        program_info = None
        if user_program:
            program_info = {
                "id": user_program.program.id,
                "name": user_program.program.name,
                "type": user_program.program.type
            }
        
        # Generar recomendaciones
        from recommendations.services import RecommendationService
        recommendations = RecommendationService.generate_recommendations_for_user(request.user)
        prioritized = RecommendationService.prioritize_recommendations(request.user)
        
        return Response({
            "message": "Onboarding marcado como completo",
            "profile_id": profile.id,
            "onboarding_complete": profile.onboarding_complete,
            "program_assigned": program_info,
            "recommendations_generated": len(recommendations),
            "prioritized_recommendations": len(prioritized)
        }, status=status.HTTP_200_OK)