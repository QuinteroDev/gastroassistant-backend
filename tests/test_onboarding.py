# tests/test_onboarding.py
import pytest
from django.urls import reverse
from profiles.models import UserProfile

@pytest.mark.django_db
class TestProfileAPI:
    """Pruebas para la API de perfiles."""
    
    def test_get_profile(self, authenticated_client, test_user):
        """Test que verifica que se puede obtener el perfil del usuario."""
        url = '/api/profiles/me/'
        response = authenticated_client.get(url)
        
        assert response.status_code == 200
        assert response.data['username'] == test_user.username
    
    def test_update_basic_info(self, authenticated_client, test_user):
        """Test que verifica que se pueden actualizar datos básicos del perfil."""
        url = '/api/profiles/me/'
        data = {
            'weight_kg': 75.5,
            'height_cm': 180,
            'first_name': 'Test Name'
        }
        
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == 200
        assert response.data['weight_kg'] == 75.5
        assert response.data['height_cm'] == 180
        
        # Verificar que los datos se guardaron en la base de datos
        test_user.refresh_from_db()
        profile = test_user.profile
        profile.refresh_from_db()
        
        assert profile.weight_kg == 75.5
        assert profile.height_cm == 180
        assert test_user.first_name == 'Test Name'
    
    def test_update_clinical_factors(self, authenticated_client, test_user):
        """Test que verifica que se pueden actualizar los factores clínicos."""
        url = '/api/profiles/me/'
        data = {
            'has_hernia': 'YES',
            'has_altered_motility': 'NO',
            'has_slow_emptying': 'UNKNOWN',
            'has_dry_mouth': 'YES',
            'has_constipation': 'NO',
            'stress_affects': 'SOMETIMES'
        }
        
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == 200
        assert response.data['has_hernia'] == 'YES'
        assert response.data['has_altered_motility'] == 'NO'
        assert response.data['has_slow_emptying'] == 'UNKNOWN'
        assert response.data['has_dry_mouth'] == 'YES'
        assert response.data['has_constipation'] == 'NO'
        assert response.data['stress_affects'] == 'SOMETIMES'
        
        # Verificar que los datos se guardaron en la base de datos
        profile = UserProfile.objects.get(user=test_user)
        assert profile.has_hernia == 'YES'
        assert profile.has_altered_motility == 'NO'
        assert profile.has_slow_emptying == 'UNKNOWN'
        assert profile.has_dry_mouth == 'YES'
        assert profile.has_constipation == 'NO'
        assert profile.stress_affects == 'SOMETIMES'
    
    def test_update_diagnostic_tests(self, authenticated_client, test_user):
        """Test que verifica que se pueden actualizar las pruebas diagnósticas."""
        url = '/api/profiles/tests/update/'
        data = {
            'has_endoscopy': True,
            'endoscopy_result': 'NORMAL',
            'has_ph_monitoring': False,
            'ph_monitoring_result': 'NOT_DONE'
        }
        
        response = authenticated_client.put(url, data)
        
        assert response.status_code == 200
        assert response.data['has_endoscopy'] == True
        assert response.data['endoscopy_result'] == 'NORMAL'
        assert response.data['has_ph_monitoring'] == False
        assert response.data['ph_monitoring_result'] == 'NOT_DONE'
        
        # Verificar que los datos se guardaron en la base de datos
        profile = UserProfile.objects.get(user=test_user)
        assert profile.has_endoscopy == True
        assert profile.endoscopy_result == 'NORMAL'
        assert profile.has_ph_monitoring == False
        assert profile.ph_monitoring_result == 'NOT_DONE'

@pytest.mark.django_db
class TestQuestionnairesAPI:
    """Pruebas para la API de cuestionarios."""
    
    def test_get_gerdq_questionnaire(self, authenticated_client, gerdq_questionnaire):
        """Test que verifica que se puede obtener el cuestionario GerdQ."""
        url = f'/api/questionnaires/{gerdq_questionnaire.id}/'
        response = authenticated_client.get(url)
        
        assert response.status_code == 200
        assert response.data['name'] == gerdq_questionnaire.name
        assert response.data['type'] == 'GERDQ'
        assert len(response.data['questions']) > 0
    
    def test_submit_gerdq_answers(self, authenticated_client, test_user, gerdq_questionnaire):
        """Test que verifica que se pueden enviar respuestas al cuestionario GerdQ."""
        # Preparar datos de respuestas
        questions = gerdq_questionnaire.questions.all().order_by('order')
        answers_data = {
            'answers': []
        }
        
        # Tomar la primera opción de cada pregunta como respuesta
        for question in questions:
            option = question.options.first()
            answers_data['answers'].append({
                'question_id': question.id,
                'selected_option_id': option.id
            })
        
        url = f'/api/questionnaires/{gerdq_questionnaire.id}/submit/'
        response = authenticated_client.post(url, answers_data, format='json')
        
        assert response.status_code == 201
        
        # Verificar que se creó el completion
        from questionnaires.models import QuestionnaireCompletion
        assert QuestionnaireCompletion.objects.filter(
            user=test_user,
            questionnaire=gerdq_questionnaire
        ).exists()
    
    def test_complete_onboarding(self, authenticated_client, test_user):
        """Test que verifica que se puede completar el onboarding manualmente."""
        url = '/api/profiles/complete-onboarding/'
        response = authenticated_client.post(url)
        
        assert response.status_code == 200
        assert response.data['onboarding_complete'] == True
        
        # Verificar que el perfil se actualizó
        profile = UserProfile.objects.get(user=test_user)
        assert profile.onboarding_complete == True

@pytest.mark.django_db
class TestFullOnboardingFlow:
    """Pruebas para el flujo completo de onboarding."""
    
    def test_complete_flow(self, authenticated_client, test_user, gerdq_questionnaire, rsi_questionnaire):
        """Test que verifica el flujo completo de onboarding."""
        # 1. Actualizar datos básicos
        authenticated_client.patch('/api/profiles/me/', {
            'weight_kg': 80,
            'height_cm': 175,
            'first_name': 'Flow Test'
        })
        
        # 2. Enviar respuestas a GerdQ
        gerdq_questions = gerdq_questionnaire.questions.all().order_by('order')
        gerdq_answers = {'answers': []}
        for q in gerdq_questions:
            opt = q.options.first()
            gerdq_answers['answers'].append({
                'question_id': q.id,
                'selected_option_id': opt.id
            })
        
        authenticated_client.post(
            f'/api/questionnaires/{gerdq_questionnaire.id}/submit/',
            gerdq_answers,
            format='json'
        )
        
        # 3. Enviar respuestas a RSI
        rsi_questions = rsi_questionnaire.questions.all().order_by('order')
        rsi_answers = {'answers': []}
        for q in rsi_questions:
            opt = q.options.first()
            rsi_answers['answers'].append({
                'question_id': q.id,
                'selected_option_id': opt.id
            })
        
        authenticated_client.post(
            f'/api/questionnaires/{rsi_questionnaire.id}/submit/',
            rsi_answers,
            format='json'
        )
        
        # 4. Actualizar factores clínicos
        authenticated_client.patch('/api/profiles/me/', {
            'has_hernia': 'YES',
            'has_altered_motility': 'NO',
            'has_slow_emptying': 'UNKNOWN',
            'has_dry_mouth': 'YES',
            'has_constipation': 'NO',
            'stress_affects': 'SOMETIMES'
        })
        
        # 5. Actualizar pruebas diagnósticas
        authenticated_client.put('/api/profiles/tests/update/', {
            'has_endoscopy': True,
            'endoscopy_result': 'NORMAL',
            'has_ph_monitoring': False,
            'ph_monitoring_result': 'NOT_DONE'
        })
        
        # 6. Completar onboarding
        response = authenticated_client.post('/api/profiles/complete-onboarding/')
        
        assert response.status_code == 200
        assert response.data['onboarding_complete'] == True
        
        # Verificar estado final
        profile = UserProfile.objects.get(user=test_user)
        assert profile.onboarding_complete == True
        assert profile.weight_kg == 80
        assert profile.height_cm == 175
        assert profile.has_hernia == 'YES'
        
        # Si hay un programa asignado, verificarlo
        if 'program_assigned' in response.data and response.data['program_assigned']:
            assert response.data['program_assigned']['id'] is not None