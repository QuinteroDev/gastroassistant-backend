# cycles/tests/conftest.py
import pytest
from django.contrib.auth.models import User


@pytest.fixture
def create_user_with_cycle():
    """Factory para crear usuario con ciclo"""
    def _create(username='testuser', cycle_number=1, status='ACTIVE'):
        from cycles.models import UserCycle
        from django.utils import timezone
        from datetime import timedelta
        
        user = User.objects.create_user(username=username)
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=cycle_number,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status=status
        )
        return user, cycle
    return _create