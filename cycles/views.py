# cycles/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import CycleService
from .serializers import CycleSerializer
from .models import UserCycle

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_cycle_status(request):
    """
    Verifica el estado del ciclo actual del usuario.
    """
    user = request.user
    current_cycle = CycleService.get_current_cycle(user)
    needs_renewal = CycleService.needs_new_cycle(user)
    
    # IMPORTANTE: Si hay un ciclo activo sin onboarding completado, marcarlo como needs_renewal
    if current_cycle and current_cycle.status == 'ACTIVE' and not current_cycle.onboarding_completed_at:
        needs_renewal = True
    
    response_data = {
        'needs_renewal': needs_renewal,
        'current_cycle': None,
        'days_remaining': 0,
        'days_elapsed': 0,
        'has_completed_onboarding': False
    }
    
    if current_cycle:
        response_data['current_cycle'] = CycleSerializer(current_cycle).data
        response_data['days_remaining'] = current_cycle.days_remaining
        response_data['days_elapsed'] = current_cycle.days_elapsed
        response_data['has_completed_onboarding'] = bool(current_cycle.onboarding_completed_at)
    
    return Response(response_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_new_cycle(request):
    """
    Inicia un nuevo ciclo para el usuario.
    """
    user = request.user
    
    # Verificar si realmente necesita un nuevo ciclo
    if not CycleService.needs_new_cycle(user):
        return Response(
            {'error': 'No se requiere un nuevo ciclo en este momento'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Crear nuevo ciclo
    new_cycle = CycleService.create_new_cycle(user)
    
    return Response({
        'message': 'Nuevo ciclo creado exitosamente',
        'cycle': CycleSerializer(new_cycle).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cycle_history(request):
    """
    Obtiene el historial de ciclos del usuario.
    """
    user = request.user
    cycles = UserCycle.objects.filter(user=user).order_by('-cycle_number')
    serializer = CycleSerializer(cycles, many=True)
    
    return Response({
        'cycles': serializer.data,
        'total_cycles': cycles.count()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_cycle_onboarding(request):
    """
    Marca el onboarding del ciclo actual como completado.
    """
    user = request.user
    cycle = CycleService.mark_cycle_onboarding_complete(user)
    
    if cycle:
        return Response({
            'message': 'Onboarding del ciclo marcado como completado',
            'cycle': CycleSerializer(cycle).data
        })
    else:
        return Response(
            {'error': 'No se encontró ciclo activo sin onboarding completado'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_cycle_setup(request):
    """
    Completa la configuración del ciclo con programa, puntuaciones y hábitos.
    """
    user = request.user
    gerdq_score = request.data.get('gerdq_score', 0)
    rsi_score = request.data.get('rsi_score', 0)
    program_id = request.data.get('program_id')
    
    # Obtener ciclo activo
    current_cycle = CycleService.get_current_cycle(user)
    if not current_cycle:
        return Response(
            {'error': 'No se encontró ciclo activo'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Obtener programa si se proporcionó
    program = None
    if program_id:
        from programs.models import TreatmentProgram
        try:
            program = TreatmentProgram.objects.get(id=program_id)
        except TreatmentProgram.DoesNotExist:
            return Response(
                {'error': f'Programa con ID {program_id} no encontrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Obtener fenotipo del perfil
    from profiles.services import PhenotypeClassificationService
    phenotype_result = PhenotypeClassificationService.classify_user(user)
    
    # Completar ciclo con toda la información
    cycle = CycleService.complete_cycle_onboarding(
        cycle=current_cycle,
        gerdq_score=gerdq_score,
        rsi_score=rsi_score,
        phenotype=phenotype_result['phenotype'],
        program=program
    )
    
    return Response({
        'message': 'Configuración del ciclo completada exitosamente',
        'cycle': CycleSerializer(cycle).data
    })