# gamification/tests/conftest.py
import pytest
from django.contrib.auth.models import User
from cycles.models import UserCycle
from gamification.models import UserLevel
from django.utils import timezone
from datetime import timedelta


@pytest.fixture
def user_with_gamification():
    """Usuario con gamificación configurada"""
    user = User.objects.create_user(username='gameuser')
    
    cycle = UserCycle.objects.create(
        user=user,
        cycle_number=1,
        start_date=timezone.now(),
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE'
    )
    
    level = UserLevel.objects.create(
        user=user,
        current_cycle=cycle,
        current_level='NOVATO'
    )
    
    return user, cycle, level