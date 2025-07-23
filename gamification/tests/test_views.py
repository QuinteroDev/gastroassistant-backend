# gamification/tests/test_views.py
import pytest
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from gamification.models import UserLevel, Medal, UserMedal, DailyPoints
from cycles.models import UserCycle


@pytest.mark.django_db
class TestGamificationViews:
    """Tests para las vistas de gamificación"""
    
    @pytest.fixture
    def authenticated_client_with_cycle(self):
        """Cliente autenticado con ciclo activo"""
        user = User.objects.create_user(username='testuser')
        token = Token.objects.create(user=user)
        
        # Crear ciclo
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        
        # Crear nivel
        level = UserLevel.objects.create(
            user=user,
            current_cycle=cycle,
            current_level='NOVATO',
            current_cycle_points=250
        )
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        return client, user, token, cycle, level
    
    def test_gamification_dashboard(self, authenticated_client_with_cycle):
        """Test obtener dashboard de gamificación"""
        client, user, _, cycle, level = authenticated_client_with_cycle
        
        url = reverse('gamification-dashboard')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['level'] == 'NOVATO'
        assert response.data['current_points'] == 250
        assert response.data['cycle_number'] == 1
        assert 'progress' in response.data
    
    def test_process_gamification(self, authenticated_client_with_cycle):
        """Test procesar gamificación"""
        client, user, _, cycle, level = authenticated_client_with_cycle
        
        url = reverse('process-gamification')
        data = {'date': timezone.now().date().isoformat()}
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == 200
        assert response.data['processed'] is True
        assert 'points_earned' in response.data
    
    def test_process_gamification_invalid_date(self, authenticated_client_with_cycle):
        """Test procesar con fecha inválida"""
        client, _, _, _, _ = authenticated_client_with_cycle
        
        url = reverse('process-gamification')
        data = {'date': 'fecha-invalida'}
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == 400
        assert 'error' in response.data
    
    def test_user_medals_view(self, authenticated_client_with_cycle):
        """Test obtener medallas del usuario"""
        client, user, _, cycle, _ = authenticated_client_with_cycle
        
        # Crear medalla ganada
        medal = Medal.objects.create(
            name='Test Medal',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1
        )
        UserMedal.objects.create(
            user=user,
            medal=medal,
            cycle_earned=cycle,
            points_when_earned=250,
            level_when_earned='NOVATO'
        )
        
        url = reverse('user-medals')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['total_medals'] == 1
        assert len(response.data['medals']) == 1
    
    def test_all_medals_view(self, authenticated_client_with_cycle):
        """Test obtener todas las medallas disponibles"""
        client, user, _, cycle, _ = authenticated_client_with_cycle
        
        # Crear varias medallas
        medal1 = Medal.objects.create(
            name='Medalla 1',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1
        )
        medal2 = Medal.objects.create(
            name='Medalla 2',
            required_points=500,
            required_level='BRONCE',
            required_cycle_number=1
        )
        
        # Usuario tiene una medalla
        UserMedal.objects.create(
            user=user,
            medal=medal1,
            cycle_earned=cycle,
            points_when_earned=100,
            level_when_earned='NOVATO'
        )
        
        url = reverse('all-medals')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['total_medals'] == 2
        assert response.data['earned_count'] == 1
        
        # Verificar is_earned
        medals_data = response.data['medals']
        assert medals_data[0]['is_earned'] is True  # medal1
        assert medals_data[1]['is_earned'] is False  # medal2
    
    def test_test_gamification_view_staff_only(self, authenticated_client_with_cycle):
        """Test que la vista de test es solo para staff"""
        client, user, _, _, _ = authenticated_client_with_cycle
        
        url = reverse('test-gamification')
        response = client.post(url)
        
        assert response.status_code == 403
        
        # Hacer al usuario staff
        user.is_staff = True
        user.save()
        
        response = client.post(url)
        assert response.status_code == 200
