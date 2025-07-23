# users/tests/test_models.py
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from users.models import PasswordResetToken


@pytest.mark.django_db
class TestPasswordResetToken:
    """Tests para el modelo PasswordResetToken"""
    
    def test_token_creation(self):
        """Test creación de token"""
        user = User.objects.create_user(username='testuser')
        token = PasswordResetToken.objects.create(user=user)
        
        assert token.user == user
        assert token.token is not None
        assert not token.used
        assert token.created_at is not None
    
    def test_token_is_valid_when_fresh(self):
        """Test que token nuevo es válido"""
        user = User.objects.create_user(username='testuser')
        token = PasswordResetToken.objects.create(user=user)
        
        assert token.is_valid() is True
    
    def test_token_invalid_when_used(self):
        """Test que token usado es inválido"""
        user = User.objects.create_user(username='testuser')
        token = PasswordResetToken.objects.create(user=user, used=True)
        
        assert token.is_valid() is False
    
    def test_token_invalid_when_expired(self):
        """Test que token expirado es inválido"""
        user = User.objects.create_user(username='testuser')
        token = PasswordResetToken.objects.create(user=user)
        
        # Simular que pasó más de 1 hora
        token.created_at = timezone.now() - timedelta(hours=2)
        token.save()
        
        assert token.is_valid() is False
    
    def test_token_str_representation(self):
        """Test representación string del token"""
        user = User.objects.create_user(username='testuser')
        token = PasswordResetToken.objects.create(user=user)
        
        assert str(token) == 'Reset token para testuser'
    
    def test_token_uniqueness(self):
        """Test que cada token es único"""
        user = User.objects.create_user(username='testuser')
        
        tokens = []
        for _ in range(5):
            token = PasswordResetToken.objects.create(user=user)
            tokens.append(str(token.token))
        
        # Verificar que todos los tokens son únicos
        assert len(set(tokens)) == 5
