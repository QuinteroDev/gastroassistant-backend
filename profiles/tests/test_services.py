# profiles/tests/test_services.py
import pytest
from django.test import TestCase
from profiles.services import PhenotypeClassificationService

class TestPhenotypeClassificationService(TestCase):
    
    def test_determine_scenario_a_erosive(self):
        """Test escenario A: GERDq+, Endoscopia con esofagitis"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=True,  # Puede ser cualquier valor
            endoscopy_done=True,
            endoscopy_positive=True,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        
        assert scenario == 'A'
    
    def test_determine_scenario_b_nerd(self):
        """Test escenario B: GERDq+, RSI-, Endoscopia normal, pH+"""
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
    
    def test_determine_scenario_c_extraesophageal(self):
        """Test escenario C: GERDq-, RSI+, Endoscopia normal"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=True,  # C requiere endoscopia hecha
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        
        assert scenario == 'C'
    
    def test_determine_scenario_f_no_tests(self):
        """Test escenario F: GERDq-, RSI+, Sin pruebas"""
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=False,  # F no tiene pruebas
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        
        assert scenario == 'F'
    
    def test_all_scenarios_coverage(self):
        """Test de cobertura de todos los escenarios A-M"""
        test_cases = [
            # (gerdq, rsi, endo_done, endo_pos, ph_done, ph_pos, ph_neg, expected_scenario)
            (True, True, True, True, False, False, False, 'A'),     # A
            (True, False, True, False, True, True, False, 'B'),     # B
            (False, True, True, False, False, False, False, 'C'),   # C
            (True, True, True, False, True, False, True, 'D'),      # D
            (True, False, False, False, False, False, False, 'E'),  # E
            (False, True, False, False, False, False, False, 'F'),  # F (corregido)
            (True, True, False, False, False, False, False, 'G'),   # G
            (False, False, True, False, True, False, True, 'H'),    # H
            (False, False, False, False, False, False, False, 'I'), # I
            (False, False, True, True, False, False, False, 'J'),   # J
            (False, False, True, False, True, True, False, 'K'),    # K
            (False, True, True, False, True, False, True, 'L'),     # L
            (True, True, True, False, True, True, False, 'M'),      # M
        ]
        
        for i, test_case in enumerate(test_cases):
            scenario = PhenotypeClassificationService.determine_scenario(*test_case[:-1])
            assert scenario == test_case[-1], f"Test case {i}: Expected {test_case[-1]}, got {scenario}"
    
    def test_determine_phenotype(self):
        """Test de mapeo de escenarios a fenotipos"""
        mappings = [
            ('A', 'EROSIVE'),
            ('B', 'NERD'),
            ('C', 'EXTRAESOPHAGEAL'),
            ('D', 'FUNCTIONAL'),
            ('E', 'SYMPTOMS_NO_TESTS'),
            ('F', 'EXTRAESOPHAGEAL_NO_TESTS'),
            ('G', 'SYMPTOMS_MIXED_NO_TESTS'),
            ('H', 'NO_SYMPTOMS'),
            ('I', 'NO_SYMPTOMS'),
            ('J', 'EROSIVE'),
            ('K', 'NERD'),
            ('L', 'EXTRAESOPHAGEAL'),
            ('M', 'NERD_MIXED'),
        ]
        
        for scenario, expected_phenotype in mappings:
            phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
            assert phenotype == expected_phenotype, f"Scenario {scenario}: Expected {expected_phenotype}, got {phenotype}"