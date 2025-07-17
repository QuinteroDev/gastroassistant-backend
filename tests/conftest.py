# tests/conftest.py
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from profiles.models import UserProfile
from questionnaires.models import Questionnaire, Question, AnswerOption

@pytest.fixture
def api_client():
    """Fixture que devuelve un cliente API."""
    return APIClient()

@pytest.fixture
def test_user():
    """Fixture que crea un usuario de prueba."""
    user = User.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )
    # Asegurarse de que el perfil existe
    UserProfile.objects.get_or_create(user=user)
    return user

@pytest.fixture
def authenticated_client(api_client, test_user):
    """Fixture que devuelve un cliente API autenticado."""
    api_client.force_authenticate(user=test_user)
    return api_client

@pytest.fixture
def gerdq_questionnaire():
    """Fixture que crea un cuestionario GerdQ con preguntas y opciones."""
    questionnaire = Questionnaire.objects.create(
        name='GerdQ_Test',
        title='Cuestionario GerdQ de prueba',
        type='GERDQ',
        description='Cuestionario para evaluar síntomas de reflujo gastroesofágico'
    )
    
    # Crear preguntas y opciones
    questions_data = [
        {
            'text': '¿Con qué frecuencia has sentido ardor detrás del esternón (pirosis)?',
            'order': 1,
            'options': [
                {'text': '0 días', 'value': 0, 'order': 1},
                {'text': '1 día', 'value': 1, 'order': 2},
                {'text': '2-3 días', 'value': 2, 'order': 3},
                {'text': '4-7 días', 'value': 3, 'order': 4},
            ]
        },
        {
            'text': '¿Con qué frecuencia has sentido contenido del estómago regresando a la garganta o boca?',
            'order': 2,
            'options': [
                {'text': '0 días', 'value': 0, 'order': 1},
                {'text': '1 día', 'value': 1, 'order': 2},
                {'text': '2-3 días', 'value': 2, 'order': 3},
                {'text': '4-7 días', 'value': 3, 'order': 4},
            ]
        },
        # Añadir más preguntas según sea necesario
    ]
    
    for q_data in questions_data:
        question = Question.objects.create(
            questionnaire=questionnaire,
            text=q_data['text'],
            order=q_data['order']
        )
        
        for opt_data in q_data['options']:
            AnswerOption.objects.create(
                question=question,
                text=opt_data['text'],
                value=opt_data['value'],
                order=opt_data['order']
            )
    
    return questionnaire

@pytest.fixture
def rsi_questionnaire():
    """Fixture que crea un cuestionario RSI con preguntas y opciones."""
    questionnaire = Questionnaire.objects.create(
        name='RSI_Test',
        title='Cuestionario RSI de prueba',
        type='RSI',
        description='Índice de Síntomas de Reflujo para evaluar la severidad'
    )
    
    # Crear preguntas y opciones (similar a GerdQ)
    questions_data = [
        {
            'text': 'Ronquera o problemas con la voz',
            'order': 1,
            'options': [
                {'text': '0 - No problema', 'value': 0, 'order': 1},
                {'text': '1 - Problema leve', 'value': 1, 'order': 2},
                {'text': '5 - Problema severo', 'value': 5, 'order': 6},
            ]
        },
        # Añadir más preguntas según sea necesario
    ]
    
    for q_data in questions_data:
        question = Question.objects.create(
            questionnaire=questionnaire,
            text=q_data['text'],
            order=q_data['order']
        )
        
        for opt_data in q_data['options']:
            AnswerOption.objects.create(
                question=question,
                text=opt_data['text'],
                value=opt_data['value'],
                order=opt_data['order']
            )
    
    return questionnaire