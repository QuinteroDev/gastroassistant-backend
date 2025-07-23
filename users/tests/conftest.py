# users/tests/conftest.py
"""
Fixtures compartidos para tests del módulo users
"""
import pytest
from django.contrib.auth.models import User


@pytest.fixture
def create_test_user():
    """Factory para crear usuarios de prueba"""
    def _create_user(**kwargs):
        defaults = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)
    return _create_user