# recommendations/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from .models import UserRecommendation
from .serializers import UserRecommendationSerializer, UserRecommendationDetailSerializer
from .services import RecommendationService

class UserRecommendationsView(generics.ListAPIView):
    """
    Vista para obtener todas las recomendaciones del usuario actual.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserRecommendationSerializer
    
    def get_queryset(self):
        return UserRecommendation.objects.filter(
            user=self.request.user
        ).select_related(
            'recommendation', 
            'recommendation__recommendation_type'
        )

class PrioritizedRecommendationsView(generics.ListAPIView):
    """
    Vista para obtener las recomendaciones prioritarias del usuario actual.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserRecommendationSerializer
    
    def get_queryset(self):
        return UserRecommendation.objects.filter(
            user=self.request.user,
            is_prioritized=True
        ).select_related(
            'recommendation', 
            'recommendation__recommendation_type'
        )

class UserRecommendationDetailView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener y actualizar detalles de una recomendación específica.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserRecommendationDetailSerializer
    
    def get_queryset(self):
        return UserRecommendation.objects.filter(
            user=self.request.user
        ).select_related(
            'recommendation', 
            'recommendation__recommendation_type'
        )
    
    def perform_update(self, serializer):
        """Solo permite actualizar is_read."""
        serializer.save(user=self.request.user)

class RegenerateRecommendationsView(APIView):
    """
    Vista para regenerar todas las recomendaciones del usuario.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Regenerar recomendaciones
        recommendations = RecommendationService.generate_recommendations_for_user(user)
        
        # Priorizar recomendaciones
        prioritized = RecommendationService.prioritize_recommendations(user)
        
        return Response({
            'message': 'Recomendaciones regeneradas con éxito.',
            'total_recommendations': len(recommendations),
            'prioritized_recommendations': len(prioritized)
        })