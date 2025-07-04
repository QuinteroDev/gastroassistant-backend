// src/screens/OnboardingHabitsScreen.tsx
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
import HeaderComponent from '../components/HeaderComponent';
import ProgressBar from '../components/ProgressBar';
import api from '../utils/api';
import { getData, saveOnboardingProgress, clearOnboardingProgress } from '../utils/storage';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../constants/theme';

// Tipos de navegación - actualizar después en archivo separado
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
  OnboardingGerdQ: undefined;
  OnboardingRsi: undefined;
  OnboardingClinicalFactors: undefined;
  OnboardingDiagnosticTests: undefined;
  OnboardingHabits: undefined;
  GeneratingProgram: undefined;
};

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
      
      // Guardar la pantalla actual
      await saveOnboardingProgress('OnboardingHabits');
    
  
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
    } catch (err: any) {
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

      // IMPORTANTE: Marcar el onboarding como completo aquí, no en GeneratingProgram
      try {
        console.log("Marcando onboarding como completo...");
        const updateResponse = await api.patch('/api/profiles/me/', {
          onboarding_complete: true
        });
        console.log("Onboarding marcado como completo:", updateResponse.data.onboarding_complete);
      } catch (updateError) {
        console.error("Error al marcar onboarding como completo:", updateError);
        // Continuamos aunque falle esto
      }

      // Eliminar el progreso de onboarding ya que ha completado
      await clearOnboardingProgress();

      // Navegar a la pantalla de generación de programa
      console.log("Navegando a GeneratingProgram...");
      navigation.navigate('GeneratingProgram');
    } catch (err: any) {
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
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Renderizar una pregunta individual
  const renderQuestion = (question: HabitQuestion, index: number) => {
    return (
      <View key={question.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.questionTextContainer}>
            <Text style={styles.questionText}>{question.text}</Text>
            {question.description && (
              <Text style={styles.questionDescription}>{question.description}</Text>
            )}
          </View>
        </View>
        
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
                  <View style={[
                    styles.radioOuter,
                    answers[question.id] === option.id && styles.radioOuterSelected
                  ]}>
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
      <HeaderComponent 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />

      <ProgressBar 
        currentStep={ONBOARDING_STEPS.HABITS} 
        totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando cuestionario de hábitos...</Text>
          </View>
        ) : error && habitQuestions.length === 0 ? (
          <View style={styles.centerContent}>
            <Icon name="alert-circle-outline" size={48} color={theme.colors.error.main} />
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
              <View style={styles.headerSection}>
                <Icon name="restaurant" size={40} color={theme.colors.primary} />
                <Text style={styles.title}>Hábitos y Rutinas</Text>
              </View>
              
              <Text style={styles.description}>
              Por favor, responde a estas preguntas sobre tus rutinas diarias y estilo de vida. Esta información nos ayudará a identificar factores que pueden estar influyendo en tus síntomas digestivos y a personalizar tus recomendaciones.
              </Text>
              
              <View style={styles.infoCard}>
                <Icon name="information-circle" size={20} color={theme.colors.info.main} />
                <Text style={styles.infoText}>
                  Última sección del cuestionario. ¡Ya casi terminas!
                </Text>
              </View>
              
              {/* Sección de preguntas */}
              {habitQuestions.map((question, index) => renderQuestion(question, index))}
              
              {/* Mensaje de error */}
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={20} color={theme.colors.error.main} />
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              )}
              
              {/* Botón de enviar */}
              <View style={styles.buttonContainer}>
                {isSubmitting ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.submitButtonText}>Finalizar Cuestionario</Text>
                    <Icon name="checkmark-circle" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
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
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  description: {
    fontSize: theme.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.info.dark,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  questionNumberText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: 22,
  },
  questionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  optionsContainer: {
    marginTop: theme.spacing.sm,
  },
  optionButton: {
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.secondary}15`,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioContainer: {
    marginRight: theme.spacing.md,
  },
  radioOuter: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
  },
  errorText: {
    color: theme.colors.error.main,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    fontSize: theme.fontSize.base,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginVertical: theme.spacing.md,
  },
  errorMessage: {
    color: theme.colors.error.dark,
    marginLeft: theme.spacing.sm,
    flex: 1,
    fontSize: theme.fontSize.sm,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  buttonContainer: {
    marginVertical: theme.spacing.xl,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
  bottomPadding: {
    height: 100,
  }
});