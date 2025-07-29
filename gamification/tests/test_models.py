# gamification/tests/test_models.py
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from gamification.models import UserLevel, Medal, UserMedal, DailyPoints, CycleGamificationSummary
from cycles.models import UserCycle


@pytest.mark.django_db
class TestUserLevelModel:
    """Tests para el modelo UserLevel"""
    
    @pytest.fixture
    def user_with_level(self):
        """Usuario con nivel de gamificación"""
        user = User.objects.create_user(username='testuser')
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
    
    def test_user_level_creation(self, user_with_level):
        """Test creación de nivel de usuario"""
        user, cycle, level = user_with_level
        
        assert level.user == user
        assert level.current_cycle == cycle
        assert level.current_level == 'NOVATO'
        assert level.current_cycle_points == 0
        assert level.total_points_all_time == 0
        assert level.current_streak == 0
    
    def test_cycle_number_property(self, user_with_level):
        """Test propiedad cycle_number"""
        user, cycle, level = user_with_level
        
        assert level.cycle_number == 1
        
        # Sin ciclo
        level.current_cycle = None
        assert level.cycle_number == 1  # Default
    
    def test_str_representation(self, user_with_level):
        """Test representación string"""
        user, cycle, level = user_with_level
        
        assert 'testuser' in str(level)
        assert 'Novato' in str(level)
        assert 'Ciclo 1' in str(level)


@pytest.mark.django_db
class TestMedalModel:
    """Tests para el modelo Medal"""
    
    def test_medal_creation(self):
        """Test creación de medalla"""
        medal = Medal.objects.create(
            name='Primera Victoria',
            description='Tu primera medalla',
            icon='🏆',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1,
            week_number=1
        )
        
        assert medal.name == 'Primera Victoria'
        assert medal.required_points == 100
        assert medal.required_cycle_number == 1
        assert medal.is_active is True
    
    def test_medal_ordering(self):
        """Test ordenamiento de medallas"""
        # Contar medallas existentes
        existing_count = Medal.objects.count()
        
        # Crear medallas en orden diferente
        medal3 = Medal.objects.create(
            name='Test M3',
            required_points=300,
            required_level='BRONCE',
            required_cycle_number=2,
            week_number=1,
            order=1
        )
        medal1 = Medal.objects.create(
            name='Test M1',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1,
            week_number=1,
            order=1
        )
        medal2 = Medal.objects.create(
            name='Test M2',
            required_points=200,
            required_level='NOVATO',
            required_cycle_number=1,
            week_number=2,
            order=1
        )
        
        # Obtener solo nuestras medallas de test
        test_medals = Medal.objects.filter(name__startswith='Test M').order_by(
            'required_cycle_number', 'week_number', 'order'
        )
        
        assert test_medals.count() == 3
        assert test_medals[0].name == 'Test M1'  # Ciclo 1, semana 1
        assert test_medals[1].name == 'Test M2'  # Ciclo 1, semana 2
        assert test_medals[2].name == 'Test M3'  # Ciclo 2, semana 1


@pytest.mark.django_db
class TestUserMedalModel:
    """Tests para el modelo UserMedal"""
    
    def test_user_medal_creation(self):
        """Test otorgar medalla a usuario"""
        user = User.objects.create_user(username='testuser')
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        medal = Medal.objects.create(
            name='Test Medal',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1
        )
        
        user_medal = UserMedal.objects.create(
            user=user,
            medal=medal,
            cycle_earned=cycle,
            points_when_earned=150,
            level_when_earned='NOVATO'
        )
        
        assert user_medal.user == user
        assert user_medal.medal == medal
        assert user_medal.cycle_earned == cycle
        assert user_medal.points_when_earned == 150
    
    def test_unique_constraint(self):
        """Test que un usuario no puede ganar la misma medalla dos veces"""
        user = User.objects.create_user(username='testuser')
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        medal = Medal.objects.create(
            name='Unique Medal',
            required_points=100,
            required_level='NOVATO',
            required_cycle_number=1
        )
        
        # Primera vez
        UserMedal.objects.create(
            user=user,
            medal=medal,
            cycle_earned=cycle,
            points_when_earned=100,
            level_when_earned='NOVATO'
        )
        
        # Segunda vez debería fallar
        with pytest.raises(Exception):  # IntegrityError
            UserMedal.objects.create(
                user=user,
                medal=medal,
                cycle_earned=cycle,
                points_when_earned=200,
                level_when_earned='BRONCE'
            )


@pytest.mark.django_db
class TestDailyPointsModel:
    """Tests para el modelo DailyPoints"""
    
    def test_daily_points_creation(self):
        """Test crear registro de puntos diarios"""
        user = User.objects.create_user(username='testuser')
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        daily_points = DailyPoints.objects.create(
            user=user,
            cycle=cycle,
            date=timezone.now().date(),
            habit_points=50,
            bonus_completion=25,
            bonus_streak=10,
            total_points=85,
            habits_completed=5,
            habits_total=5
        )
        
        assert daily_points.total_points == 85
        assert daily_points.habits_completed == 5
        assert str(daily_points) == f"testuser - {timezone.now().date()} (85pts) - Ciclo 1"
    
    def test_unique_constraint(self):
        """Test que solo puede haber un registro por usuario y fecha"""
        user = User.objects.create_user(username='testuser')
        cycle = UserCycle.objects.create(
            user=user,
            cycle_number=1,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30)
        )
        today = timezone.now().date()
        
        # Primer registro
        DailyPoints.objects.create(
            user=user,
            cycle=cycle,
            date=today,
            total_points=100
        )
        
        # Segundo registro mismo día debería fallar
        with pytest.raises(Exception):  # IntegrityError
            DailyPoints.objects.create(
                user=user,
                cycle=cycle,
                date=today,
                total_points=200
            )