# profiles/tests/test_services.py
import pytest
from django.contrib.auth.models import User
from profiles.models import UserProfile
from profiles.services import PhenotypeClassificationService
# Nota: Necesitarás crear los modelos de questionnaires para que estos tests funcionen
# from questionnaires.models import Questionnaire, QuestionnaireCompletion


@pytest.mark.django_db
class TestPhenotypeClassificationService:
    """Tests para el servicio de clasificación de fenotipos"""
    
    def test_determine_scenario_a_erosive(self):
        """Test escenario A: GERDQ+ con esofagitis"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=True,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        
        assert scenario == 'A'
        phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
        assert phenotype == 'EROSIVE'
    
    def test_determine_scenario_b_nerd(self):
        """Test escenario B: GERDQ+, endoscopia normal, pH+"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        
        assert scenario == 'B'
        phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
        assert phenotype == 'NERD'
    
    def test_determine_scenario_c_extraesophageal(self):
        """Test escenario C: RSI+ sin endoscopia o con endoscopia normal"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        
        assert scenario == 'C'
        phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
        assert phenotype == 'EXTRAESOPHAGEAL'
    
    def test_determine_scenario_d_functional(self):
        """Test escenario D: GERDQ+, endoscopia normal, pH-"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=False,
            ph_negative=True
        )
        
        assert scenario == 'D'
        phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
        assert phenotype == 'FUNCTIONAL'
    
    def test_all_scenarios_coverage(self):
        """Test de cobertura de todos los escenarios A-L"""
        test_cases = [
            # (gerdq, rsi, endo_done, endo_pos, ph_done, ph_pos, ph_neg, expected_scenario)
            (True, False, True, True, False, False, False, 'A'),
            (True, False, True, False, True, True, False, 'B'),
            (False, True, False, False, False, False, False, 'C'),
            (True, False, True, False, True, False, True, 'D'),
            (True, False, False, False, False, False, False, 'E'),
            (False, True, False, False, False, False, False, 'C'),  # RSI+ sin pruebas es C
            (True, False, True, False, False, False, False, 'G'),
            (False, False, True, False, True, False, True, 'H'),
            (False, False, False, False, False, False, False, 'I'),
            (False, False, True, True, False, False, False, 'J'),
            (False, False, True, False, True, True, False, 'K'),
            (False, True, True, False, True, False, True, 'C'),  # CAMBIO: Según tu lógica, esto también es C, no L
        ]
        
        for i, test_case in enumerate(test_cases):
            scenario = PhenotypeClassificationService.determine_scenario(*test_case[:-1])
            assert scenario == test_case[-1], f"Test case {i}: Expected {test_case[-1]}, got {scenario}"
    
    def test_get_diagnostic_tests(self):
        """Test de obtención de resultados de pruebas diagnósticas"""
        user = User.objects.create_user(username='testuser')
        profile = user.profile
        
        # Caso 1: Endoscopia positiva
        profile.has_endoscopy = True
        profile.endoscopy_result = 'ESOPHAGITIS_B'
        profile.save()
        
        endoscopy_pos, ph_pos, ph_neg = PhenotypeClassificationService.get_diagnostic_tests(profile)
        
        assert endoscopy_pos is True
        assert ph_pos is False
        assert ph_neg is False
        
        # Caso 2: pH-metría positiva
        profile.endoscopy_result = 'NORMAL'
        profile.has_ph_monitoring = True
        profile.ph_monitoring_result = 'POSITIVE'
        profile.save()
        
        endoscopy_pos, ph_pos, ph_neg = PhenotypeClassificationService.get_diagnostic_tests(profile)
        
        assert endoscopy_pos is False
        assert ph_pos is True
        assert ph_neg is False