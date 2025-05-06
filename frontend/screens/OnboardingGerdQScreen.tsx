// screens/OnboardingGerdQScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import api from '../utils/api';
import { getData } from '../utils/storage';

// ID del cuestionario GerdQ en el sistema
const GERDQ_QUESTIONNAIRE_ID = 1;

// Interfaz para las preguntas y opciones
interface Option {
  id: number;
  text: string;
  value: number;
  order: number;
}

interface Question {
  id: number;
  text: string;
  order: number;
  options: Option[];
}

interface Questionnaire {
  id: number;
  name: string;
  title: string;
  type: string;
  description: string;
  questions: Question[];
}

type OnboardingGerdQNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingGerdQ'>;

export default function OnboardingGerdQScreen() {
  const navigation = useNavigation<OnboardingGerdQNavigationProp>();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingGerdQScreen...");
      const token = await getData('authToken');
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Si hay token, cargar el cuestionario
      fetchQuestionnaire();
    };
    
    checkAuth();
  }, [navigation]);

  // Función para cargar el cuestionario
  const fetchQuestionnaire = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Obteniendo cuestionario...");
      const response = await api.get(`/api/questionnaires/${GERDQ_QUESTIONNAIRE_ID}/`);
      
      console.log("Datos del cuestionario:", 
        response.data ? `ID:${response.data.id}, Preguntas:${response.data.questions?.length || 0}` : "No hay datos");
      
      // Verificar la estructura de datos
      if (response.data && response.data.questions) {
        response.data.questions.forEach((q: any, i: number) => {
          console.log(`Pregunta ${i+1}: ID:${q.id}, Opciones:${q.options?.length || 0}`);
          if (q.options && q.options.length > 0) {
            console.log(`  Opción 1: ID:${q.options[0].id}, Texto:"${q.options[0].text}"`);
          }
        });
      }
      
      setQuestionnaire(response.data);
    } catch (err) {
      console.error("Error loading questionnaire:", err);
      let message = "Error al cargar el cuestionario";
      
      if (err.response && err.response.status === 401) {
        message = "Sesión expirada. Por favor inicia sesión nuevamente.";
        
        Alert.alert(
          "Sesión expirada",
          message,
          [{ text: "Ir a Login", onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}]
        );
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar selección de respuesta
  const handleSelectAnswer = (questionId: number, optionId: number) => {
    console.log(`Seleccionando respuesta: Pregunta ID=${questionId}, Opción ID=${optionId}`);
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // Enviar respuestas
  const handleSubmit = async () => {
    // Validar que todas las preguntas tienen respuesta
    if (
      !questionnaire?.questions || 
      questionnaire.questions.length === 0 || 
      Object.keys(answers).length !== questionnaire.questions.length
    ) {
      Alert.alert('Incompleto', 'Por favor, responde todas las preguntas del cuestionario.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Formatear las respuestas para enviar al API
      const answersData = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        selected_option_id: optionId
      }));

      console.log("Enviando respuestas:", answersData);
      
      const response = await api.post(`/api/questionnaires/${GERDQ_QUESTIONNAIRE_ID}/submit/`, {
        answers: answersData
      });

      console.log("Respuestas enviadas correctamente:", response.data);
      
      // Mostrar resultado y navegar al siguiente cuestionario RSI
      let message = 'Has completado el cuestionario GerdQ. ';
      if (response.data.score !== undefined) {
        message += `\nTu puntuación es: ${response.data.score}`;
      }
      
      // Navegación directa sin esperar al Alert
      console.log("Intentando navegar a OnboardingRsi...");
      
      // OPCIÓN 1: Intentar navegar primero y luego mostrar el Alert
      navigation.navigate('OnboardingRsi');
      
      Alert.alert(
        "Cuestionario Completado",
        message,
        [
          { 
            text: "Continuar", 
            onPress: () => {
              // OPCIÓN 2: Intentar navegar nuevamente después de que el usuario presione "Continuar"
              console.log("Navegando a OnboardingRsi desde el botón de alerta...");
              navigation.navigate('OnboardingRsi');
            }
          }
        ]
      );
    } catch (err) {
      console.error("Error al enviar respuestas:", err);
      let message = "Error al enviar las respuestas";
      
      if (err.response && err.response.status === 401) {
        message = "Sesión expirada. Por favor inicia sesión nuevamente.";
        
        Alert.alert(
          "Sesión expirada",
          message,
          [{ text: "Ir a Login", onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}]
        );
      } else if (err.response && err.response.data && err.response.data.detail) {
        message = err.response.data.detail;
        Alert.alert("Error", message);
      } else {
        setError(message);
        Alert.alert("Error", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar si todas las preguntas tienen respuesta
  const allQuestionsAnswered = questionnaire?.questions && 
    Object.keys(answers).length === questionnaire.questions.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <HeaderComponent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando cuestionario...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchQuestionnaire()}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !questionnaire ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No se pudo cargar el cuestionario</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>{questionnaire.title || 'Cuestionario GerdQ'}</Text>
            
            <Text style={styles.description}>
              {questionnaire.description || 'Por favor responde todas las preguntas del cuestionario.'}
            </Text>
            
            {/* Renderizado seguro de preguntas */}
            {questionnaire.questions && questionnaire.questions.length > 0 ? (
              questionnaire.questions.map((question: Question) => (
                <View key={question.id} style={styles.questionCard}>
                  <Text style={styles.questionText}>{question.text}</Text>
                  
                  {/* Renderizado seguro de opciones */}
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option: Option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionButton,
                          answers[question.id] === option.id && styles.selectedOption
                        ]}
                        onPress={() => handleSelectAnswer(question.id, option.id)}
                        disabled={isSubmitting}
                      >
                        <View style={styles.optionRow}>
                          <View style={styles.radioContainer}>
                            <View style={styles.radioOuter}>
                              {answers[question.id] === option.id && 
                                <View style={styles.radioInner} />
                              }
                            </View>
                          </View>
                          <Text style={[
                            styles.optionText,
                            answers[question.id] === option.id && styles.selectedOptionText
                          ]}>
                            {option.text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.errorText}>No hay opciones disponibles para esta pregunta</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.errorText}>No hay preguntas disponibles en el cuestionario</Text>
            )}
            
            <View style={styles.buttonContainer}>
              {isSubmitting ? (
                <ActivityIndicator size="large" color="#0077B6" />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !allQuestionsAnswered && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={!allQuestionsAnswered}
                >
                  <Text style={styles.submitButtonText}>
                    Enviar respuestas
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Espacio adicional al final */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
      )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#005f73',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#0077B6',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#212529',
  },
  optionButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedOption: {
    borderColor: '#0077B6',
    backgroundColor: '#e6f7ff',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0077B6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#0077B6',
  },
  optionText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  selectedOptionText: {
    color: '#0077B6',
    fontWeight: '500',
  },
  buttonContainer: {
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0077B6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  }
});