# cycles/tests/test_views.py
import pytest
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from cycles.models import UserCycle
from cycles.services import CycleService
from programs.models import TreatmentProgram


@pytest.mark.django_db
class TestCycleViews:
    """Tests para las vistas de ciclos"""
    
    @pytest.fixture
    def authenticated_client(self):
        """Cliente autenticado"""
        user = User.objects.create_user(username='testuser')
        token = Token.objects.create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        return client, user, token
    
    def test_check_cycle_status_no_cycle(self, authenticated_client):
        """Test verificar estado sin ciclo"""
        client, user, _ = authenticated_client
        
        url = reverse('cycles:check-status')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['needs_renewal'] is True
        assert response.data['current_cycle'] is None
        assert response.data['days_remaining'] == 0
    
    def test_check_cycle_status_with_active_cycle(self, authenticated_client):
        """Test verificar estado con ciclo activo"""
        client, user, _ = authenticated_client
        
        # Crear ciclo activo
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE',
            onboarding_completed_at=timezone.now()
        )
        
        url = reverse('cycles:check-status')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['needs_renewal'] is False
        assert response.data['current_cycle'] is not None
        assert response.data['days_remaining'] >= 29
        assert response.data['has_completed_onboarding'] is True
    
    def test_start_new_cycle(self, authenticated_client):
        """Test iniciar nuevo ciclo"""
        client, user, _ = authenticated_client
        
        url = reverse('cycles:start-new')
        response = client.post(url)
        
        assert response.status_code == 200
        assert 'cycle' in response.data
        assert response.data['cycle']['cycle_number'] == 1
        
        # Verificar que se creó
        assert UserCycle.objects.filter(user=user).count() == 1
    
    def test_start_new_cycle_when_not_needed(self, authenticated_client):
        """Test intentar iniciar ciclo cuando no es necesario"""
        client, user, _ = authenticated_client
        
        # Crear ciclo activo
        UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE',
            onboarding_completed_at=timezone.now()
        )
        
        url = reverse('cycles:start-new')
        response = client.post(url)
        
        assert response.status_code == 400
        assert 'error' in response.data
    
    def test_get_cycle_history(self, authenticated_client):
        """Test obtener historial de ciclos"""
        client, user, _ = authenticated_client
        
        # Crear varios ciclos
        for i in range(3):
            UserCycle.objects.create(
                user=user,
                cycle_number=i+1,
                start_date=timezone.now() - timedelta(days=30*(3-i)),
                end_date=timezone.now() - timedelta(days=30*(2-i)),
                status='COMPLETED' if i < 2 else 'ACTIVE'
            )
        
        url = reverse('cycles:history')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['total_cycles'] == 3
        assert len(response.data['cycles']) == 3
        # Verificar orden descendente
        assert response.data['cycles'][0]['cycle_number'] == 3
    
    def test_complete_cycle_onboarding(self, authenticated_client):
        """Test marcar onboarding como completo"""
        client, user, _ = authenticated_client
        
        # Crear ciclo sin onboarding
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        url = reverse('cycles:complete-onboarding')
        response = client.post(url)
        
        assert response.status_code == 200
        
        # Verificar que se actualizó
        cycle.refresh_from_db()
        assert cycle.onboarding_completed_at is not None
    
    def test_complete_cycle_setup(self, authenticated_client):
        """Test completar configuración del ciclo"""
        client, user, _ = authenticated_client
        
        # Crear ciclo y programa
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        program = TreatmentProgram.objects.create(
            name='Programa Test',
            type='A',
            description='Test'
        )
        
        url = reverse('cycles:complete-setup')
        data = {
            'gerdq_score': 12,
            'rsi_score': 8,
            'program_id': program.id
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == 200
        
        # Verificar actualización
        cycle.refresh_from_db()
        assert cycle.gerdq_score == 12
        assert cycle.rsi_score == 8
        assert cycle.program == program
        assert cycle.phenotype != 'UNDETERMINED'
