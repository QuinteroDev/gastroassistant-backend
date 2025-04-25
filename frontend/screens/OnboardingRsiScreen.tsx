// screens/OnboardingRsiScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
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
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent'; // Importamos el componente de header

// URL Base para la API
const API_URL = 'http://192.168.1.48:8000';
const RSI_QUESTIONNAIRE_ID = 2; // Asumiendo que el ID del cuestionario RSI es 2

type OnboardingRsiNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingRsi'>;

export default function OnboardingRsiScreen() {
  const navigation = useNavigation<OnboardingRsiNavigationProp>();
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingRsiScreen...");
      const token = await SecureStore.getItemAsync('authToken');
      console.log("Token en OnboardingRsiScreen:", token ? "Existe" : "No existe");
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Si hay token, cargar el cuestionario
      fetchQuestionnaire(token);
    };
    
    checkAuth();
  }, [navigation]);

  // Función para cargar el cuestionario
  const fetchQuestionnaire = async (token: string | null = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!token) {
        token = await SecureStore.getItemAsync('authToken');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
      }

      console.log("Obteniendo cuestionario RSI...");
      const response = await fetch(`${API_URL}/api/questionnaires/${RSI_QUESTIONNAIRE_ID}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Respuesta status:", response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.log("Error response:", responseText);
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { detail: responseText };
        }
        throw new Error(errorData.detail || `Error ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log("Respuesta recibida, parseando JSON...");
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Datos del cuestionario RSI:", 
          data ? `ID:${data.id}, Preguntas:${data.questions?.length || 0}` : "No hay datos");
        
        // Verificar la estructura de datos
        if (data && data.questions) {
          data.questions.forEach((q: any, i: number) => {
            console.log(`Pregunta ${i+1}: ID:${q.id}, Opciones:${q.options?.length || 0}`);
            if (q.options && q.options.length > 0) {
              console.log(`  Opción 1: ID:${q.options[0].id}, Texto:"${q.options[0].text}"`);
            }
          });
        }
        
        setQuestionnaire(data);
      } catch (e) {
        console.error("Error al parsear JSON:", e);
        throw new Error('Error al parsear los datos del cuestionario RSI');
      }
      
    } catch (err) {
      console.error("Error loading questionnaire:", err);
      const message = err instanceof Error ? err.message : 'Error al cargar el cuestionario RSI';
      
      if (message.includes('token') || message.includes('401')) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "Ir a Login", onPress: () => {
            // El cierre de sesión ahora lo maneja el HeaderComponent
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
    if (
      !questionnaire?.questions || 
      questionnaire.questions.length === 0 || 
      Object.keys(answers).length !== questionnaire.questions.length
    ) {
      Alert.alert('Incompleto', 'Por favor, responde todas las preguntas del cuestionario RSI.');
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
  
      // Formatear las respuestas para enviar al API
      const answersData = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        selected_option_id: optionId
      }));
  
      console.log("Enviando respuestas RSI:", answersData);
      
      const response = await fetch(`${API_URL}/api/questionnaires/${RSI_QUESTIONNAIRE_ID}/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersData
        }),
      });
  
      console.log("Respuesta status:", response.status);
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error al parsear respuesta:", e);
        data = { detail: responseText };
      }
  
      if (response.ok) {
        console.log("Respuestas RSI enviadas correctamente:", data);
        
        // Mostrar resultado y navegar al cuestionario de Hábitos
        let message = 'Has completado el cuestionario RSI. ';
        if (data.score !== undefined) {
          message += `\nTu puntuación es: ${data.score}`;
        }
        
        Alert.alert(
          "Cuestionario RSI Completado",
          message,
          [
            { 
              text: "Continuar", 
              onPress: () => {
                // Navegar al cuestionario de Hábitos
                navigation.navigate('OnboardingHabits');
              }
            }
          ]
        );
      } else {
        const errorMessage = data?.detail || 'Error al enviar las respuestas RSI.';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Error al enviar respuestas RSI:", err);
      const message = err instanceof Error ? err.message : 'Error de red al enviar las respuestas RSI';
      
      if (message.includes('token') || message.includes('401')) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "Ir a Login", onPress: () => {
            // El cierre de sesión ahora lo maneja el HeaderComponent
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}]
        );
      } else {
        setError(message);
        Alert.alert("Error", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const allQuestionsAnswered = questionnaire?.questions && 
    Object.keys(answers).length === questionnaire.questions.length;

  return (
    <View style={styles.container}>
      {/* Implementamos el HeaderComponent */}
      <HeaderComponent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando cuestionario RSI...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Reintentar" onPress={() => fetchQuestionnaire()} />
        </View>
      ) : !questionnaire ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No se pudo cargar el cuestionario RSI</Text>
          <Button title="Volver" onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>{questionnaire.title || 'Cuestionario RSI'}</Text>
            
            <Text style={styles.description}>
              {questionnaire.description || 'Por favor responde todas las preguntas del cuestionario RSI.'}
            </Text>
            
            {/* Renderizado seguro de preguntas */}
            {questionnaire.questions && questionnaire.questions.length > 0 ? (
              questionnaire.questions.map((question: any) => (
                <View key={question.id} style={styles.questionCard}>
                  <Text style={styles.questionText}>{question.text}</Text>
                  
                  {/* Renderizado seguro de opciones */}
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option: any) => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.optionButton}
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
                          <Text style={styles.optionText}>
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
              <Text style={styles.errorText}>No hay preguntas disponibles en el cuestionario RSI</Text>
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
    borderRadius: 8,
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
    borderRadius: 8,
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
  bottomPadding: {
    height: 100,
  }
});