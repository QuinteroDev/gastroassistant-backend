// screens/OnboardingHabitsScreen.tsx
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
import { Ionicons } from '@expo/vector-icons';

type OnboardingHabitsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingHabits'>;

// Interfaz para la respuesta de pregunta de hábito
interface HabitAnswer {
  question_id: number;
  option_id: number;
}

// Interfaz para pregunta de hábito
interface HabitQuestion {
  id: number;
  habit_type: string;
  text: string;
  description: string;
  options: HabitOption[];
}

// Interfaz para opción de respuesta
interface HabitOption {
  id: number;
  text: string;
  value: number;
  order: number;
}

export default function OnboardingHabitsScreen() {
  const navigation = useNavigation<OnboardingHabitsNavigationProp>();
  
  // Estado para preguntas, respuestas y UI
  const [habitQuestions, setHabitQuestions] = useState<HabitQuestion[]>([]);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar token y cargar preguntas
  useEffect(() => {
    const initializeScreen = async () => {
      console.log("Verificando token en OnboardingHabitsScreen...");
      const token = await getData('authToken');
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      fetchHabitQuestions();
    };
    
    initializeScreen();
  }, [navigation]);
  
  // Función para cargar las preguntas de hábitos
  const fetchHabitQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Obteniendo preguntas de hábitos...");
      const response = await api.get('/api/questionnaires/habits/');
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Se obtuvieron ${response.data.length} preguntas de hábitos`);
        setHabitQuestions(response.data);
      } else {
        console.error("Formato de respuesta inesperado:", response.data);
        setError("Error al cargar las preguntas de hábitos. Formato de datos incorrecto.");
      }
    } catch (err) {
      console.error("Error al cargar preguntas de hábitos:", err);
      let message = "Error al cargar el cuestionario de hábitos";
      
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
  
  // Función para seleccionar una respuesta
  const handleSelectAnswer = (questionId: number, optionId: number) => {
    console.log(`Seleccionando respuesta: Pregunta ID=${questionId}, Opción ID=${optionId}`);
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // Validar que todas las preguntas tienen respuesta
  const validateAnswers = (): boolean => {
    if (habitQuestions.length === 0) {
      setError("No hay preguntas disponibles.");
      return false;
    }
    
    const answeredQuestionsCount = Object.keys(answers).length;
    if (answeredQuestionsCount !== habitQuestions.length) {
      setError(`Por favor, responde todas las preguntas. Has respondido ${answeredQuestionsCount} de ${habitQuestions.length}.`);
      return false;
    }
    
    return true;
  };
  
  // Enviar respuestas
  const handleSubmit = async () => {
    if (!validateAnswers()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Formatear las respuestas para enviar
      const answersData = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        option_id: optionId
      }));
      
      console.log("Enviando respuestas de hábitos:", answersData);
      
      // Enviar datos al servidor
      const response = await api.post('/api/questionnaires/habits/submit/', {
        answers: answersData
      });
      
      console.log("Respuestas de hábitos enviadas correctamente:", response.data);
      
      // Navegar directamente a la pantalla de resultados de fenotipo
      console.log("Intentando navegar a PhenotypeResult...");
      navigation.navigate('PhenotypeResult');
      
      // Mostrar mensaje de éxito después de iniciar la navegación
      Alert.alert(
        "Cuestionario Completado",
        "Tus respuestas al cuestionario de hábitos han sido guardadas correctamente.",
        [{ text: "Aceptar" }]
      );
    } catch (err) {
      console.error("Error al enviar respuestas de hábitos:", err);
      let message = "Error al guardar tus respuestas";
      
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
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Renderizar una pregunta individual
  const renderQuestion = (question: HabitQuestion) => {
    return (
      <View key={question.id} style={styles.questionCard}>
        <Text style={styles.questionText}>{question.text}</Text>
        {question.description && (
          <Text style={styles.questionDescription}>{question.description}</Text>
        )}
        
        <View style={styles.optionsContainer}>
          {question.options.map(option => (
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
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <HeaderComponent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0077B6" />
            <Text style={styles.loadingText}>Cargando cuestionario de hábitos...</Text>
          </View>
        ) : error && habitQuestions.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchHabitQuestions}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.content}>
              <Text style={styles.title}>Hábitos Digestivos</Text>
              
              <Text style={styles.description}>
                Por favor, responde a estas preguntas sobre tus hábitos relacionados con la digestión.
                Esta información nos ayudará a personalizar tus recomendaciones.
              </Text>
              
              {/* Sección de preguntas */}
              {habitQuestions.map(question => renderQuestion(question))}
              
              {/* Mensaje de error */}
              {error && <Text style={styles.errorMessage}>{error}</Text>}
              
              {/* Botón de enviar */}
              {isSubmitting ? (
                <ActivityIndicator size="large" color="#0077B6" style={styles.activityIndicator} />
              ) : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    Finalizar Cuestionario
                  </Text>
                </TouchableOpacity>
              )}
              
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
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    lineHeight: 22,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 22,
  },
  questionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  optionsContainer: {
    marginTop: 10,
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  errorMessage: {
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFD2D2',
    padding: 10,
    borderRadius: 5,
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
  activityIndicator: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
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