# programs/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserProgram, TreatmentProgram
from .serializers import UserProgramSerializer, TreatmentProgramSerializer

class UserProgramView(generics.RetrieveAPIView):
    """
    Vista para obtener el programa asignado al usuario actual.
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
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)



