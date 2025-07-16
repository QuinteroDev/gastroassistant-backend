// src/screens/OnboardingClinicalFactorsScreen.tsx
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
import { getData, saveOnboardingProgress } from '../utils/storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import { theme } from '../constants/theme';

// Tipos de navegación - EXACTOS como los tenías
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
};

type OnboardingClinicalFactorsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingClinicalFactors'>;

// Interfaces para el cuestionario dinámico
interface AnswerOption {
  id: number;
  text: string;
  value: number;
  order: number;
}

interface Question {
  id: number;
  text: string;
  order: number;
  options: AnswerOption[];
}

interface Questionnaire {
  id: number;
  name: string;
  title: string;
  type: string;
  description: string;
  questions: Question[];
}

interface UserAnswer {
  question_id: number;
  selected_option_id: number;
}

export default function OnboardingClinicalFactorsScreen() {
  const navigation = useNavigation<OnboardingClinicalFactorsNavigationProp>();
  
  // Estado para el cuestionario dinámico
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar token al cargar la pantalla - EXACTO como lo tenías
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingClinicalFactorsScreen...");
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
      await saveOnboardingProgress('OnboardingClinicalFactors');
      
      // Cargar cuestionario
      await loadClinicalFactorsQuestionnaire();
    };
  
    checkAuth();
  }, [navigation]);
  
  // Cargar el cuestionario de factores clínicos desde el backend
  const loadClinicalFactorsQuestionnaire = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Cargando cuestionario de factores clínicos...");
      const response = await api.get('/api/questionnaires/clinical-factors/');
      
      console.log("Cuestionario cargado:", response.data);
      setQuestionnaire(response.data);
      
    } catch (err: any) {
      console.error('Error loading clinical factors questionnaire:', err);
      
      let errorMessage = 'No se pudo cargar el cuestionario de factores clínicos.';
      
      if (err.response?.status === 404) {
        errorMessage = 'El cuestionario de factores clínicos no está disponible. Contacta con soporte.';
      } else if (err.response?.status === 401) {
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
          [{ 
            text: 'Ir a Login', 
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          }]
        );
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar selección de respuesta
  const handleAnswerSelect = (questionId: number, optionId: number) => {
    console.log(`Pregunta ${questionId}: Opción seleccionada ${optionId}`);
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
    
    // Limpiar error si existe
    if (error) {
      setError(null);
    }
  };
  
  // Validar el formulario - SIN efectos secundarios
  const canProceed = () => {
    if (!questionnaire) return false;
    
    // Verificar que todas las preguntas han sido respondidas
    return questionnaire.questions.every(question => 
      answers.hasOwnProperty(question.id)
    );
  };
  
  // Enviar respuestas - EXACTA lógica que tenías pero con endpoint nuevo
  const handleSubmit = async () => {
    if (!questionnaire || !canProceed()) {
      const unansweredCount = questionnaire ? questionnaire.questions.length - Object.keys(answers).length : 0;
      setError(`Por favor responde todas las preguntas antes de continuar. Faltan ${unansweredCount} respuesta(s).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Preparar las respuestas en el formato esperado por el backend
      const formattedAnswers: UserAnswer[] = questionnaire.questions.map(question => ({
        question_id: question.id,
        selected_option_id: answers[question.id]
      }));

      const payload = {
        answers: formattedAnswers
      };

      console.log("Enviando datos de factores clínicos:", payload);

      // Intentar hasta 3 veces si es necesario - COMO TENÍAS
      let success = false;
      let maxRetries = 3;
      let responseData;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const timestamp = new Date().getTime();
          const response = await api.post(`/api/questionnaires/clinical-factors/submit/?t=${timestamp}`, payload);
          
          responseData = response.data;
          console.log(`Intento ${attempt} - Respuesta:`, responseData);
          
          success = true;
          break;
        } catch (err) {
          console.error(`Error en intento ${attempt}:`, err);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            throw err;
          }
        }
      }
      
      if (!success) {
        setError('No se pudieron guardar todos los datos correctamente. Por favor, inténtalo de nuevo.');
        console.error("No se pudieron guardar los datos después de múltiples intentos");
        return;
      }

      // Guardar el progreso antes de navegar
      await saveOnboardingProgress('OnboardingDiagnosticTests');
      
      // Verificar si el onboarding está completo
      if (responseData?.onboarding_complete) {
        console.log("Onboarding completado!");
        Alert.alert(
          'Onboarding Completado',
          'Has completado todos los pasos del registro. Tu programa personalizado está listo.',
          [
            {
              text: 'Ver Mi Programa',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
            }
          ]
        );
      } else {
        // Navegar a la siguiente pantalla del onboarding - EXACTO como tenías
        console.log("Navegando a OnboardingDiagnosticTests...");
        navigation.navigate('OnboardingDiagnosticTests');
      }

    } catch (err: any) {
      console.error("Error al enviar datos de factores clínicos:", err);
      let message = "Error al guardar los datos de factores clínicos";
      
      if (err.response) {
        console.error("Detalles de la respuesta de error:", {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
        
        if (err.response.status === 401) {
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
        } else if (err.response.data && err.response.data.detail) {
          message = err.response.data.detail;
          Alert.alert("Error", message);
        } else if (err.response.data?.error) {
          message = err.response.data.error;
        }
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Renderizar opciones para cada pregunta - EXACTO como tenías pero dinámico
  const renderOptions = (
    question: Question, 
    questionIndex: number
  ) => {
    // Verificar si necesita dos filas (más de 3 opciones)
    const needsTwoRows = question.options.length > 3;
    
    // Verificar si es la pregunta larga (pregunta 9 - alteraciones intestinales)
    const isLongQuestion = question.order === 9;
    
    return (
      <View style={isLongQuestion ? styles.questionCardLong : styles.questionCard}>
        <Text style={isLongQuestion ? styles.questionTextLong : styles.questionText}>
          {question.text}
        </Text>
        
        {needsTwoRows ? (
          // Layout de dos filas para preguntas con 4 opciones
          <View style={styles.optionsTwoRowsContainer}>
            <View style={styles.optionsRow}>
              {question.options.slice(0, 2).map((option) => renderSingleOption(question, option, needsTwoRows))}
            </View>
            <View style={styles.optionsRow}>
              {question.options.slice(2).map((option) => renderSingleOption(question, option, needsTwoRows))}
            </View>
          </View>
        ) : (
          // Layout normal de una fila
          <View style={styles.optionsRowContainer}>
            {question.options.map((option) => renderSingleOption(question, option, needsTwoRows))}
          </View>
        )}
      </View>
    );
  };
  
  // Renderizar una opción individual
  const renderSingleOption = (question: Question, option: AnswerOption, needsTwoRows: boolean) => {
    const isSelected = answers[question.id] === option.id;
    const optionStyle = getOptionStyle(question, option);
    const backgroundColor = isSelected ? optionStyle.color : theme.colors.background;
    const optionWidth = needsTwoRows ? '48%' : (100 / question.options.length - 2) + '%';
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionButton,
          isSelected && styles.selectedOption,
          { 
            width: optionWidth,
            backgroundColor: backgroundColor,
            borderColor: isSelected ? optionStyle.color : theme.colors.border.light
          }
        ]}
        onPress={() => handleAnswerSelect(question.id, option.id)}
        disabled={isSubmitting}
      >
        <Icon 
          name={optionStyle.icon} 
          size={20} 
          color={isSelected ? theme.colors.surface : theme.colors.text.secondary} 
          style={styles.optionIcon}
        />
        <Text style={[
          styles.optionText,
          isSelected && styles.selectedOptionText
        ]}>
          {option.text}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Obtener estilo de opción según la pregunta
  const getOptionStyle = (question: Question, option: AnswerOption) => {
    const questionOrder = question.order;
    
    // Configurar colores e iconos según el tipo de pregunta
    if (questionOrder === 3) { // Helicobacter pylori
      switch (option.value) {
        case 3: return { icon: 'warning-outline', color: theme.colors.error.main }; // Activa
        case 2: return { icon: 'checkmark-circle-outline', color: theme.colors.warning.main }; // Tratada
        case 0: return { icon: 'close-circle-outline', color: theme.colors.success.main }; // No
        case 1: return { icon: 'help-circle-outline', color: theme.colors.warning.main }; // No sé
      }
    } else if (questionOrder === 8) { // Estrés
      switch (option.value) {
        case 2: return { icon: 'checkmark-circle-outline', color: theme.colors.error.main }; // Sí claramente
        case 1: return { icon: 'time-outline', color: theme.colors.warning.main }; // A veces
        case 0: return { icon: 'close-circle-outline', color: theme.colors.success.main }; // No
      }
    } else if (questionOrder === 7) { // Estreñimiento (3 opciones)
      switch (option.value) {
        case 1: return { icon: 'checkmark-circle-outline', color: theme.colors.error.main }; // Sí
        case 2: return { icon: 'time-outline', color: theme.colors.warning.main }; // A veces
        case 0: return { icon: 'close-circle-outline', color: theme.colors.success.main }; // No
      }
    } else if (questionOrder === 10) { // Tabaquismo (2 opciones)
      switch (option.value) {
        case 1: return { icon: 'checkmark-circle-outline', color: theme.colors.error.main }; // Sí
        case 0: return { icon: 'close-circle-outline', color: theme.colors.success.main }; // No
      }
    } else if (questionOrder === 11) { // Alcohol
      switch (option.value) {
        case 2: return { icon: 'wine-outline', color: theme.colors.error.main }; // Sí
        case 1: return { icon: 'time-outline', color: theme.colors.warning.main }; // A veces
        case 0: return { icon: 'close-circle-outline', color: theme.colors.success.main }; // No
      }
    } else { // Resto de preguntas (sí/no/no sé)
      switch (option.value) {
        case 1: return { icon: 'checkmark-circle-outline', color: theme.colors.error.main }; // Sí
        case 0: return { icon: 'close-circle-outline', color: theme.colors.success.main }; // No
        case 2: return { icon: 'help-circle-outline', color: theme.colors.warning.main }; // No sé
      }
    }
    
    return { icon: 'help-circle-outline', color: theme.colors.primary };
  };
  
  // Si está cargando
  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderComponent showBackButton={true} onBackPress={() => navigation.goBack()} />
        <ProgressBar 
          currentStep={ONBOARDING_STEPS.CLINICAL_FACTORS} 
          totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando cuestionario...</Text>
        </View>
      </View>
    );
  }
  
  // Si hay error y no se cargó el cuestionario
  if (!questionnaire) {
    return (
      <View style={styles.container}>
        <HeaderComponent showBackButton={true} onBackPress={() => navigation.goBack()} />
        <ProgressBar 
          currentStep={ONBOARDING_STEPS.CLINICAL_FACTORS} 
          totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color={theme.colors.error.main} />
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadClinicalFactorsQuestionnaire}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <HeaderComponent 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />

      <ProgressBar 
        currentStep={ONBOARDING_STEPS.CLINICAL_FACTORS} 
        totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Icon name="clipboard-outline" size={40} color={theme.colors.primary} />
              <Text style={styles.title}>Factores de Riesgo</Text>
            </View>
            
            <Text style={styles.description}>
              Queremos saber si existen factores médicos que puedan estar influyendo en tus síntomas. Esta información nos ayudará a personalizar tus recomendaciones.
            </Text>
            
            <View style={styles.infoCard}>
              <Icon name="information-circle" size={20} color={theme.colors.info.main} />
              <Text style={styles.infoText}>
                Responde basándote en tu historial médico. Si no estás seguro, selecciona "No sé".
              </Text>
            </View>
            
            {/* Renderizar todas las preguntas dinámicamente */}
            {questionnaire.questions.map((question, index) => (
              <React.Fragment key={question.id}>
                {renderOptions(question, index)}
              </React.Fragment>
            ))}
                        
            {/* Mensaje de error */}
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={20} color={theme.colors.error.main} />
                <Text style={styles.errorText}>{error}</Text>
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
                  <Text style={styles.submitButtonText}>Guardar y Continuar</Text>
                  <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Espacio adicional al final */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginVertical: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.error.main,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error.dark,
    marginLeft: theme.spacing.sm,
    flex: 1,
    fontSize: theme.fontSize.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
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
  questionCardLong: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    minHeight: 120, // Altura mínima mayor para pregunta larga
    ...theme.shadows.sm,
  },
  questionText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  questionTextLong: {
    fontSize: theme.fontSize.xs, // Más pequeño aún
    fontWeight: '500', // Menos bold
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 18, // Más compacto
    flexWrap: 'wrap',
    flexShrink: 1,
    width: '100%', // Asegurar que ocupe todo el ancho
  },
  optionsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginHorizontal: -3,
  },
  optionsTwoRowsContainer: {
    gap: theme.spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginHorizontal: -3,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    marginHorizontal: 3,
    minHeight: 50,
  },
  selectedOption: {
    borderWidth: 1.5,
  },
  optionIcon: {
    marginRight: theme.spacing.xs,
  },
  optionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  selectedOptionText: {
    color: theme.colors.surface,
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