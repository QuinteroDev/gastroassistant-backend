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
};

type OnboardingClinicalFactorsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingClinicalFactors'>;

interface ClinicalFactorsData {
  has_hernia: string;
  has_altered_motility: string;
  has_slow_emptying: string;
  has_dry_mouth: string;
  has_constipation: string;
  stress_affects: string;
}

export default function OnboardingClinicalFactorsScreen() {
  const navigation = useNavigation<OnboardingClinicalFactorsNavigationProp>();
  
  // Estado para cada factor clínico
  const [hasHernia, setHasHernia] = useState<string | null>(null);
  const [alteredMotility, setAlteredMotility] = useState<string | null>(null);
  const [slowEmptying, setSlowEmptying] = useState<string | null>(null);
  const [dryMouth, setDryMouth] = useState<string | null>(null);
  const [constipation, setConstipation] = useState<string | null>(null);
  const [stressAffects, setStressAffects] = useState<string | null>(null);
  
  // Estado de la UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar token al cargar la pantalla
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
      
    };
  
    checkAuth();
  }, [navigation]);
  
  // Validar el formulario
  const validateForm = (): boolean => {
    if (!hasHernia || !alteredMotility || !slowEmptying || !dryMouth || !constipation || !stressAffects) {
      setError('Por favor, responde todas las preguntas del cuestionario.');
      return false;
    }
    return true;
  };
  
  // Enviar respuestas
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      // Preparar los datos para enviar
      const clinicalFactorsData: ClinicalFactorsData = {
        has_hernia: hasHernia!,
        has_altered_motility: alteredMotility!,
        has_slow_emptying: slowEmptying!,
        has_dry_mouth: dryMouth!,
        has_constipation: constipation!,
        stress_affects: stressAffects!
      };
  
      console.log("Enviando datos de factores clínicos:", clinicalFactorsData);
  
      // Intentar hasta 3 veces si es necesario
      let success = false;
      let maxRetries = 3;
      let updatedProfile;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Añadir timestamp para evitar posible caché
          const timestamp = new Date().getTime();
          const response = await api.patch(`/api/profiles/me/?t=${timestamp}`, clinicalFactorsData);
          
          updatedProfile = response.data;
          console.log(`Intento ${attempt} - Respuesta:`, updatedProfile);
          
          // Verificar que todos los datos se guardaron correctamente
          const allFactorsSaved = 
            updatedProfile.has_hernia === hasHernia &&
            updatedProfile.has_altered_motility === alteredMotility &&
            updatedProfile.has_slow_emptying === slowEmptying &&
            updatedProfile.has_dry_mouth === dryMouth &&
            updatedProfile.has_constipation === constipation &&
            updatedProfile.stress_affects === stressAffects;
            
          if (allFactorsSaved) {
            success = true;
            break;
          } else {
            console.warn(`⚠️ Intento ${attempt}: No todos los factores clínicos se guardaron correctamente`);
            console.warn("Enviados:", clinicalFactorsData);
            console.warn("Recibidos:", updatedProfile);
            
            // Esperar un poco antes del siguiente intento
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (err) {
          console.error(`Error en intento ${attempt}:`, err);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            throw err; // Relanzar el último error
          }
        }
      }
      
      if (!success) {
        // Si después de todos los intentos no se guardaron bien, mostrar un error
        setError('No se pudieron guardar todos los datos correctamente. Por favor, inténtalo de nuevo.');
        console.error("No se pudieron guardar los datos después de múltiples intentos");
        
        // Pero intentamos continuar de todos modos
        if (updatedProfile) {
          console.log("Continuando con datos parciales");
        } else {
          throw new Error("No se pudieron guardar los datos");
        }
      }
  
      // Guardar el progreso antes de navegar
      await saveOnboardingProgress('OnboardingDiagnosticTests');
      
      // Navegar a la siguiente pantalla del onboarding
      console.log("Navegando a OnboardingDiagnosticTests...");
      navigation.navigate('OnboardingDiagnosticTests');
  
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
        }
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Renderizar opciones para cada pregunta (sí/no/no lo sé)
  const renderOptions = (
    question: string, 
    value: string | null, 
    setValue: (value: string) => void, 
    options: Array<{id: string, label: string, icon?: string, color?: string}>
  ) => {
    return (
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question}</Text>
        <View style={styles.optionsRowContainer}>
          {options.map(option => {
            const isSelected = value === option.id;
            const backgroundColor = isSelected && option.color ? option.color : 
                                  isSelected ? theme.colors.primary : 
                                  theme.colors.background;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isSelected && styles.selectedOption,
                  { 
                    width: (100 / options.length - 2) + '%',
                    backgroundColor: backgroundColor,
                    borderColor: isSelected ? (option.color || theme.colors.primary) : theme.colors.border.light
                  }
                ]}
                onPress={() => setValue(option.id)}
                disabled={isSubmitting}
              >
                {option.icon && (
                  <Icon 
                    name={option.icon} 
                    size={20} 
                    color={isSelected ? theme.colors.surface : theme.colors.text.secondary} 
                    style={styles.optionIcon}
                  />
                )}
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };
  
  // Opciones estándar para preguntas de sí/no/no lo sé
  const yesNoUnknownOptions = [
    { id: 'YES', label: 'Sí', icon: 'checkmark-circle-outline', color: theme.colors.success.main },
    { id: 'NO', label: 'No', icon: 'close-circle-outline', color: theme.colors.error.main },
    { id: 'UNKNOWN', label: 'No sé', icon: 'help-circle-outline', color: theme.colors.warning.main }
  ];
  
  // Opciones para preguntas de sí/no
  const yesNoOptions = [
    { id: 'YES', label: 'Sí', icon: 'checkmark-circle-outline', color: theme.colors.success.main },
    { id: 'NO', label: 'No', icon: 'close-circle-outline', color: theme.colors.error.main }
  ];
  
  // Opciones para la pregunta de estrés/ansiedad
  const stressOptions = [
    { id: 'YES', label: 'Sí, claramente', icon: 'checkmark-circle-outline', color: theme.colors.success.main },
    { id: 'SOMETIMES', label: 'A veces', icon: 'time-outline', color: theme.colors.warning.main },
    { id: 'NO', label: 'No', icon: 'close-circle-outline', color: theme.colors.error.main }
  ];
  
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
              <Icon name="fitness" size={40} color={theme.colors.primary} />
              <Text style={styles.title}>Factores Clínicos</Text>
            </View>
            
            <Text style={styles.description}>
              Por favor, responde a estas preguntas sobre factores que pueden influir en tu reflujo.
              Esta información nos ayudará a personalizar tus recomendaciones.
            </Text>
            
            <View style={styles.infoCard}>
              <Icon name="information-circle" size={20} color={theme.colors.info.main} />
              <Text style={styles.infoText}>
                Responde con sinceridad basándote en tu historial médico
              </Text>
            </View>
            
            {/* Factor 1: Hernia de hiato */}
            {renderOptions(
              '¿Te han diagnosticado hernia de hiato o una válvula de cierre del estómago débil (cardias incompetente)?',
              hasHernia,
              setHasHernia,
              yesNoUnknownOptions
            )}
            
            {/* Factor 2: Motilidad esofágica alterada */}
            {renderOptions(
              '¿Te han detectado alguna alteración en el movimiento del esófago (por ejemplo, en una manometría o prueba funcional)?',
              alteredMotility,
              setAlteredMotility,
              yesNoUnknownOptions
            )}
            
            {/* Factor 3: Vaciamiento gástrico lento */}
            {renderOptions(
              '¿Te han dicho que tu estómago vacía más lento de lo normal (gastroparesia)?',
              slowEmptying,
              setSlowEmptying,
              yesNoUnknownOptions
            )}
            
            {/* Factor 4: Salivación reducida */}
            {renderOptions(
              '¿Tienes sequedad de boca frecuente o te han comentado que produces poca saliva?',
              dryMouth,
              setDryMouth,
              yesNoUnknownOptions
            )}
            
            {/* Factor 5: Estreñimiento */}
            {renderOptions(
              '¿Sueles tener estreñimiento o necesitas hacer mucho esfuerzo al ir al baño?',
              constipation,
              setConstipation,
              yesNoOptions
            )}
            
            {/* Factor 6: Estrés/ansiedad */}
            {renderOptions(
              '¿Sientes que el estrés o la ansiedad empeoran claramente tus síntomas digestivos?',
              stressAffects,
              setStressAffects,
              stressOptions
            )}
            
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
  questionText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  optionsRowContainer: {
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginVertical: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error.dark,
    marginLeft: theme.spacing.sm,
    flex: 1,
    fontSize: theme.fontSize.sm,
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