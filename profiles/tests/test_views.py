# profiles/tests/test_views.py
import pytest
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from profiles.models import UserProfile


@pytest.mark.django_db
class TestUserProfileViews:
    """Tests para las vistas del perfil de usuario"""
    
    @pytest.fixture
    def authenticated_client(self):
        """Cliente autenticado para las pruebas"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        token = Token.objects.create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        return client, user, token
    
    def test_get_user_profile(self, authenticated_client):
        """Test obtener perfil del usuario autenticado"""
        client, user, _ = authenticated_client
        
        url = reverse('user-profile')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['username'] == 'testuser'
        assert response.data['email'] == 'test@example.com'
        assert 'weight_kg' in response.data
        assert 'height_cm' in response.data
    
    def test_update_user_profile(self, authenticated_client):
        """Test actualizar perfil del usuario"""
        client, user, _ = authenticated_client
        
        url = reverse('user-profile')
        data = {
            'weight_kg': 75.5,
            'height_cm': 180,
            'avatar': 'avatar2'
        }
        
        response = client.patch(url, data, format='json')
        
        assert response.status_code == 200
        
        # Verificar que se actualizó
        user.profile.refresh_from_db()
        assert user.profile.weight_kg == 75.5
        assert user.profile.height_cm == 180
        assert user.profile.avatar == 'avatar2'
        assert user.profile.bmi == 23.3  # Verificar cálculo de BMI
    
    def test_update_diagnostic_tests(self, authenticated_client):
        """Test actualizar pruebas diagnósticas"""
        client, user, _ = authenticated_client
        
        url = reverse('update-diagnostic-tests')
        data = {
            'has_endoscopy': True,
            'endoscopy_result': 'ESOPHAGITIS_B',
            'has_ph_monitoring': False
        }
        
        response = client.put(url, data, format='json')
        
        assert response.status_code == 200
        
        # Verificar actualización
        user.profile.refresh_from_db()
        assert user.profile.has_endoscopy is True
        assert user.profile.endoscopy_result == 'ESOPHAGITIS_B'
        assert 'phenotype_result' in response.data
    
    def test_get_user_phenotype(self, authenticated_client):
        """Test obtener fenotipo del usuario"""
        client, user, _ = authenticated_client
        
        # Configurar fenotipo
        user.profile.phenotype = 'EROSIVE'
        user.profile.scenario = 'A'
        user.profile.save()
        
        url = reverse('user-phenotype')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['phenotype_code'] == 'EROSIVE'
        assert response.data['phenotype_display'] == 'ERGE Erosiva'
        assert response.data['scenario'] == 'A'
        assert 'recommendations' in response.data
        assert len(response.data['recommendations']) > 0
    
    def test_complete_onboarding(self, authenticated_client):
        """Test completar onboarding"""
        client, user, _ = authenticated_client
        
        url = reverse('complete-onboarding')
        response = client.post(url)
        
        assert response.status_code == 200
        assert response.data['message'] == 'Onboarding marcado como completo'
        
        # Verificar que se completó
        user.profile.refresh_from_db()
        assert user.profile.onboarding_complete is True
    
    def test_update_clinical_factors(self, authenticated_client):
        """Test actualizar factores clínicos"""
        client, user, _ = authenticated_client
        
        url = reverse('user-profile')
        data = {
            'has_hernia': 'YES',
            'has_gastritis': 'NO',
            'is_smoker': 'NO',
            'alcohol_consumption': 'OCCASIONALLY',
            'stress_affects': 'SOMETIMES'
        }
        
        response = client.patch(url, data, format='json')
        
        assert response.status_code == 200
        
        # Verificar actualización
        user.profile.refresh_from_db()
        assert user.profile.has_hernia == 'YES'
        assert user.profile.has_gastritis == 'NO'
        assert user.profile.is_smoker == 'NO'
        assert user.profile.alcohol_consumption == 'OCCASIONALLY'
        assert user.profile.stress_affects == 'SOMETIMES'  # CAMBIO: Quitar la verificación de UNKNOWN
    
    def test_unauthenticated_access_denied(self):
        """Test que usuarios no autenticados no pueden acceder"""
        client = APIClient()
        
        urls = [
            reverse('user-profile'),
            reverse('update-diagnostic-tests'),
            reverse('user-phenotype'),
            reverse('complete-onboarding')
        ]
        
        for url in urls:
            response = client.get(url)
            assert response.status_code == 401