# profiles/tests/test_serializers.py
import pytest
from django.contrib.auth.models import User
from profiles.models import UserProfile
from profiles.serializers import UserProfileSerializer


@pytest.mark.django_db
class TestUserProfileSerializer:
    """Tests para el serializador de UserProfile"""
    
    @pytest.fixture
    def user_with_profile(self):
        """Usuario con perfil para las pruebas"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test'
        )
        return user
    
    def test_serializer_contains_expected_fields(self, user_with_profile):
        """Test que el serializador contiene todos los campos esperados"""
        serializer = UserProfileSerializer(user_with_profile.profile)
        data = serializer.data
        
        expected_fields = [
            'id', 'username', 'email', 'first_name', 'weight_kg', 'avatar',
            'height_cm', 'has_hernia', 'has_altered_motility', 'has_slow_emptying',
            'has_dry_mouth', 'has_constipation', 'stress_affects', 'has_endoscopy',
            'endoscopy_result', 'has_ph_monitoring', 'ph_monitoring_result',
            'phenotype', 'scenario', 'onboarding_complete', 'updated_at'
        ]
        
        for field in expected_fields:
            assert field in data
    
    def test_read_only_fields(self, user_with_profile):
        """Test que los campos read-only no se pueden modificar"""
        data = {
            'id': 999,
            'phenotype': 'MODIFIED',
            'scenario': 'Z',
            'weight_kg': 80
        }
        
        serializer = UserProfileSerializer(
            user_with_profile.profile,
            data=data,
            partial=True
        )
        
        assert serializer.is_valid()
        instance = serializer.save()
        
        # Los campos read-only no deben cambiar
        assert instance.id != 999
        assert instance.phenotype != 'MODIFIED'
        assert instance.scenario != 'Z'
        # Pero weight_kg sí debe cambiar
        assert instance.weight_kg == 80
    
    def test_user_fields_included(self, user_with_profile):
        """Test que los campos del modelo User están incluidos"""
        serializer = UserProfileSerializer(user_with_profile.profile)
        data = serializer.data
        
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@example.com'
        assert data['first_name'] == 'Test'
    
    def test_update_user_fields_through_serializer(self, user_with_profile):
        """Test actualizar campos del User a través del serializador"""
        data = {'first_name': 'Updated'}
        
        serializer = UserProfileSerializer(
            user_with_profile.profile,
            data=data,
            partial=True
        )
        
        assert serializer.is_valid()
        serializer.save()
        
        # Verificar que se actualizó el campo del User
        user_with_profile.refresh_from_db()
        assert user_with_profile.first_name == 'Updated'
