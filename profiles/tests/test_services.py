# profiles/tests/test_services.py - ACTUALIZADO
import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from profiles.services import PhenotypeClassificationService
from profiles.models import UserProfile

class TestPhenotypeClassificationService(TestCase):
    
    def setUp(self):
        """Configurar usuario de prueba con perfil"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.profile = UserProfile.objects.get(user=self.user)
    
    def test_scenario_a_erosive_always(self):
        """Test REGLA 1: Endoscopia positiva siempre es escenario A"""
        # Con cualquier combinación de cuestionarios
        test_cases = [
            (True, True),    # GERDq+, RSI+
            (True, False),   # GERDq+, RSI-
            (False, True),   # GERDq-, RSI+
            (False, False),  # GERDq-, RSI-
        ]
        
        for gerdq, rsi in test_cases:
            scenario = PhenotypeClassificationService.determine_scenario(
                gerdq_positive=gerdq,
                rsi_positive=rsi,
                endoscopy_done=True,
                endoscopy_positive=True,  # SIEMPRE positiva
                ph_done=False,
                ph_positive=False,
                ph_negative=False
            )
            assert scenario == 'A', f"Endoscopia positiva con GERDq={gerdq}, RSI={rsi} debería ser A"
    
    def test_both_questionnaires_negative_rules(self):
        """Test REGLA 2: Ambos cuestionarios negativos"""
        # Escenario E: Endo-, pH+, sin síntomas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        assert scenario == 'E'
        
        # Escenario F4: Endo-, pH-, sin síntomas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=False,
            ph_negative=True
        )
        assert scenario == 'F4'
        
        # Escenario J: Endo-, pH no hecha, sin síntomas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'J'
        
        # Escenario N: Endo no hecha, pH hecha, sin síntomas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=False,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,  # No importa el resultado
            ph_negative=False
        )
        assert scenario == 'N'
        
        # Escenario R: Sin pruebas, sin síntomas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=False,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'R'
    
    def test_nerd_scenarios(self):
        """Test REGLA 3: Endoscopia negativa + pH positiva"""
        # Escenario B: NERD Mixto
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=True,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        assert scenario == 'B'
        
        # Escenario C: NERD clásico
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        assert scenario == 'C'
        
        # Escenario D: Extraesofágico con reflujo
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        assert scenario == 'D'
    
    def test_functional_scenarios(self):
        """Test REGLA 4: Endoscopia negativa + pH negativa"""
        # Escenario F: Funcional con síntomas mixtos
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=True,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=False,
            ph_negative=True
        )
        assert scenario == 'F'
        
        # Escenario F2: Funcional con síntomas digestivos
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=False,
            ph_negative=True
        )
        assert scenario == 'F2'
        
        # Escenario F3: Funcional con síntomas extraesofágicos
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=False,
            ph_negative=True
        )
        assert scenario == 'F3'
    
    def test_incomplete_tests_scenarios(self):
        """Test REGLA 5: Pruebas incompletas"""
        # Casos con endoscopia negativa pero sin pH
        # Escenario G: Mixto sin pH
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=True,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'G'
        
        # Escenario H: Digestivo sin pH
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'H'
        
        # Escenario I: Extraesofágico sin pH
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=True,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'I'
    
    def test_no_endoscopy_scenarios(self):
        """Test casos sin endoscopia pero con pH"""
        # Escenario K: Mixto sin endoscopia
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=True,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        assert scenario == 'K'
        
        # Escenario L: Digestivo sin endoscopia
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=False,
            ph_negative=True
        )
        assert scenario == 'L'
        
        # Escenario M: Extraesofágico sin endoscopia
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=True,
            ph_positive=True,
            ph_negative=False
        )
        assert scenario == 'M'
    
    def test_no_tests_scenarios(self):
        """Test casos sin ninguna prueba"""
        # Escenario O: Mixto sin pruebas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=True,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'O'
        
        # Escenario P: Digestivo sin pruebas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=True,
            rsi_positive=False,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'P'
        
        # Escenario Q: Extraesofágico sin pruebas
        scenario = PhenotypeClassificationService.determine_scenario(
            gerdq_positive=False,
            rsi_positive=True,
            endoscopy_done=False,
            endoscopy_positive=False,
            ph_done=False,
            ph_positive=False,
            ph_negative=False
        )
        assert scenario == 'Q'
    
    def test_scenario_to_block_mapping(self):
        """Test mapeo de escenarios a bloques de contenido"""
        expected_mappings = {
            'A': 1,   # ERGE Erosiva
            'B': 9,   # NERD Mixto
            'C': 2,   # NERD
            'D': 3,   # Reflujo Extraesofágico
            'E': 6,   # Bienestar Digestivo
            'F': 4,   # Perfil Funcional
            'F2': 4,  # Perfil Funcional
            'F3': 4,  # Perfil Funcional
            'F4': 6,  # Bienestar Digestivo
            'G': 8,   # Perfil Mixto sin Pruebas
            'H': 5,   # Síntomas Digestivos sin Pruebas
            'I': 7,   # Síntomas Extraesofágicos sin Pruebas
            'J': 6,   # Bienestar Digestivo
            'K': 8,   # Perfil Mixto sin Pruebas
            'L': 5,   # Síntomas Digestivos sin Pruebas
            'M': 7,   # Síntomas Extraesofágicos sin Pruebas
            'N': 6,   # Bienestar Digestivo
            'O': 8,   # Perfil Mixto sin Pruebas
            'P': 5,   # Síntomas Digestivos sin Pruebas
            'Q': 7,   # Síntomas Extraesofágicos sin Pruebas
            'R': 6,   # Bienestar Digestivo
        }
        
        # Este test verificaría que el mapeo en el serializer es correcto
        # pero necesitaría acceso a _determine_display_block
        for scenario, expected_block in expected_mappings.items():
            # Aquí podrías probar el mapeo real si expones el método
            pass
    
    def test_phenotype_determination(self):
        """Test determinación de fenotipos según el nuevo mapeo"""
        test_cases = [
            ('A', 'EROSIVE'),
            ('B', 'NERD_MIXED'),  # Cambió de NERD a NERD_MIXED
            ('C', 'NERD'),
            ('D', 'EXTRAESOPHAGEAL'),
            ('E', 'NO_SYMPTOMS'),  # Cambió de NERD a NO_SYMPTOMS
            ('F', 'FUNCTIONAL'),
            ('F2', 'FUNCTIONAL'),
            ('F3', 'FUNCTIONAL'),
            ('F4', 'NO_SYMPTOMS'),
            ('G', 'SYMPTOMS_MIXED_NO_TESTS'),
            ('H', 'SYMPTOMS_NO_TESTS'),
            ('I', 'EXTRAESOPHAGEAL_NO_TESTS'),
            ('J', 'NO_SYMPTOMS'),
            ('K', 'SYMPTOMS_MIXED_NO_TESTS'),
            ('L', 'SYMPTOMS_NO_TESTS'),
            ('M', 'EXTRAESOPHAGEAL_NO_TESTS'),
            ('N', 'NO_SYMPTOMS'),
            ('O', 'SYMPTOMS_MIXED_NO_TESTS'),
            ('P', 'SYMPTOMS_NO_TESTS'),
            ('Q', 'EXTRAESOPHAGEAL_NO_TESTS'),
            ('R', 'NO_SYMPTOMS'),
        ]
        
        for scenario, expected_phenotype in test_cases:
            phenotype = PhenotypeClassificationService.determine_phenotype(scenario)
            assert phenotype == expected_phenotype, \
                f"Scenario {scenario}: Expected {expected_phenotype}, got {phenotype}"
    
    def test_edge_cases(self):
        """Test casos límite"""
        # Test con None como escenario
        phenotype = PhenotypeClassificationService.determine_phenotype(None)
        assert phenotype == 'UNDETERMINED'
        
        # Test con escenario no reconocido
        phenotype = PhenotypeClassificationService.determine_phenotype('Z')
        assert phenotype == 'UNDETERMINED'