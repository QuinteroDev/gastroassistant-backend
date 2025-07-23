# profiles/tests/conftest.py
"""
Configuración compartida para todos los tests del módulo profiles
"""
import pytest
from django.contrib.auth.models import User


@pytest.fixture
def create_user():
    """Factory para crear usuarios"""
    def _create_user(username='testuser', email='test@example.com', **kwargs):
        return User.objects.create_user(
            username=username,
            email=email,
            password='testpass123',
            **kwargs
        )
    return _create_user


@pytest.fixture
def sample_users(create_user):
    """Crea múltiples usuarios de ejemplo"""
    users = []
    for i in range(3):
        user = create_user(
            username=f'user{i}',
            email=f'user{i}@example.com'
        )
        users.append(user)
    return users