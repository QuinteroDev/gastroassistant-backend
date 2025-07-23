# profiles/tests/test_models.py
import pytest
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from profiles.models import UserProfile


@pytest.mark.django_db
class TestUserProfileModel:
    """Tests para el modelo UserProfile"""
    
    def test_profile_creation_on_user_creation(self):
        """Test que se crea automáticamente un perfil cuando se crea un usuario"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        assert hasattr(user, 'profile')
        assert isinstance(user.profile, UserProfile)
        assert user.profile.phenotype == 'UNDETERMINED'
        assert user.profile.onboarding_complete is False
    
    def test_bmi_calculation(self):
        """Test del cálculo automático del IMC"""
        user = User.objects.create_user(username='testuser2')
        profile = user.profile
        
        # Caso 1: Peso normal
        profile.weight_kg = 70
        profile.height_cm = 175
        profile.save()
        
        assert profile.bmi == 22.86
        assert profile.has_excess_weight is False
        
        # Caso 2: Sobrepeso
        profile.weight_kg = 85
        profile.save()
        
        assert profile.bmi == 27.76
        assert profile.has_excess_weight is True
    
    def test_bmi_not_calculated_without_data(self):
        """Test que el IMC no se calcula sin peso o altura"""
        user = User.objects.create_user(username='testuser3')
        profile = user.profile
        
        profile.weight_kg = 70
        profile.save()
        
        assert profile.bmi is None
        assert profile.has_excess_weight is False
    
    def test_profile_str_representation(self):
        """Test de la representación string del perfil"""
        user = User.objects.create_user(username='testuser4')
        assert str(user.profile) == 'Perfil de testuser4'
    
    def test_weight_validators(self):
        """Test de los validadores de peso"""
        user = User.objects.create_user(username='testuser5')
        profile = user.profile
        
        # Peso muy bajo
        profile.weight_kg = 25
        with pytest.raises(ValidationError):
            profile.full_clean()
        
        # Peso muy alto
        profile.weight_kg = 300
        with pytest.raises(ValidationError):
            profile.full_clean()
        
        # Peso válido
        profile.weight_kg = 75
        profile.full_clean()  # No debe lanzar excepción
    
    def test_height_validators(self):
        """Test de los validadores de altura"""
        user = User.objects.create_user(username='testuser6')
        profile = user.profile
        
        # Altura muy baja
        profile.height_cm = 90
        with pytest.raises(ValidationError):
            profile.full_clean()
        
        # Altura muy alta
        profile.height_cm = 250
        with pytest.raises(ValidationError):
            profile.full_clean()
        
        # Altura válida
        profile.height_cm = 175
        profile.full_clean()  # No debe lanzar excepción
    
    def test_all_clinical_factors_have_default_values(self):
        """Test que todos los factores clínicos tienen valores por defecto"""
        user = User.objects.create_user(username='testuser7')
        profile = user.profile
        
        assert profile.has_hernia == 'UNKNOWN'
        assert profile.has_altered_motility == 'UNKNOWN'
        assert profile.has_slow_emptying == 'UNKNOWN'
        assert profile.has_dry_mouth == 'UNKNOWN'
        assert profile.has_constipation == 'NO'
        assert profile.stress_affects == 'UNKNOWN'
        assert profile.has_gastritis == 'UNKNOWN'
        assert profile.h_pylori_status == 'UNKNOWN'
        assert profile.has_intestinal_disorders == 'UNKNOWN'
        assert profile.is_smoker == 'NO'
        assert profile.alcohol_consumption == 'NO'
    
    def test_diagnostic_tests_default_values(self):
        """Test que las pruebas diagnósticas tienen valores por defecto correctos"""
        user = User.objects.create_user(username='testuser8')
        profile = user.profile
        
        assert profile.has_endoscopy is False
        assert profile.endoscopy_result == 'NOT_DONE'
        assert profile.has_ph_monitoring is False
        assert profile.ph_monitoring_result == 'NOT_DONE'
    
    def test_avatar_choices(self):
        """Test de las opciones de avatar"""
        user = User.objects.create_user(username='testuser9')
        profile = user.profile
        
        assert profile.avatar == 'default'
        
        # Probar cambio de avatar
        profile.avatar = 'avatar3'
        profile.save()
        profile.refresh_from_db()
        assert profile.avatar == 'avatar3'
