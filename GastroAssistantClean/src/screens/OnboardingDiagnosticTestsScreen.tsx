// src/screens/OnboardingDiagnosticTestsScreen.tsx
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
  KeyboardAvoidingView,
  Switch
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
  OnboardingHabits: undefined;
};

type OnboardingDiagnosticTestsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingDiagnosticTests'>;

// Interfaz para los datos del formulario
interface DiagnosticTestsData {
  has_endoscopy: boolean;
  endoscopy_result: string | null;
  has_ph_monitoring: boolean;
  ph_monitoring_result: string | null;
}

export default function OnboardingDiagnosticTestsScreen() {
  const navigation = useNavigation<OnboardingDiagnosticTestsNavigationProp>();
  
  // Estado del formulario
  const [hasEndoscopy, setHasEndoscopy] = useState<boolean>(false);
  const [endoscopyResult, setEndoscopyResult] = useState<string | null>(null);
  const [hasPHMonitoring, setHasPHMonitoring] = useState<boolean>(false);
  const [phMonitoringResult, setPHMonitoringResult] = useState<string | null>(null);
  
  // Estado de la UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingDiagnosticTestsScreen...");
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
      await saveOnboardingProgress('OnboardingDiagnosticTests');
      
    };
  
    checkAuth();
  }, [navigation]);

  // Opciones para resultados de endoscopia - ACTUALIZADAS
  const endoscopyOptions = [
    { id: 'NORMAL', label: 'Normal (sin erosiones ni inflamación en el esófago)' },
    { id: 'ESOPHAGITIS_A', label: 'Con esofagitis o erosiones en el esófago' },
    { id: 'UNKNOWN', label: 'No lo recuerdo' }
  ];

  // Opciones para resultados de pH-metría
  const phMonitoringOptions = [
    { id: 'POSITIVE', label: 'Positiva (confirma reflujo)' },
    { id: 'NEGATIVE', label: 'Negativa (no confirma reflujo)' },
    { id: 'UNKNOWN', label: 'No recuerdo el resultado' }
  ];

  // Enviar datos
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Verificar que los resultados estén seleccionados si las pruebas están marcadas
      if (hasEndoscopy && !endoscopyResult) {
        setError('Por favor, selecciona el resultado de la endoscopia');
        setIsSubmitting(false);
        return;
      }

      if (hasPHMonitoring && !phMonitoringResult) {
        setError('Por favor, selecciona el resultado de la pH-metría');
        setIsSubmitting(false);
        return;
      }

      // Preparar datos para enviar
      const diagnosticData: DiagnosticTestsData = {
        has_endoscopy: hasEndoscopy,
        endoscopy_result: hasEndoscopy ? endoscopyResult : 'NOT_DONE',
        has_ph_monitoring: hasPHMonitoring,
        ph_monitoring_result: hasPHMonitoring ? phMonitoringResult : 'NOT_DONE'
      };

      console.log("Enviando datos de pruebas diagnósticas:", diagnosticData);
      
      // Enviar datos al servidor
      const response = await api.put('/api/profiles/tests/update/', diagnosticData);
      
      console.log("Datos de pruebas diagnósticas enviados correctamente:", response.data);

      await saveOnboardingProgress('OnboardingHabits');

      // Navegar a la siguiente pantalla del onboarding
      console.log("Navegando a OnboardingHabits...");
      navigation.navigate('OnboardingHabits');
    } catch (err: any) {
      console.error("Error al enviar datos de pruebas diagnósticas:", err);
      let message = "Error al guardar los datos de pruebas diagnósticas";
      
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

  return (
    <View style={styles.container}>
      <HeaderComponent 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />

      <ProgressBar 
        currentStep={ONBOARDING_STEPS.DIAGNOSTIC_TESTS} 
        totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Icon name="flask" size={40} color={theme.colors.primary} />
              <Text style={styles.title}>Pruebas Diagnósticas</Text>
            </View>
            
            <Text style={styles.description}>
            Indica si te han realizado alguna de estas pruebas diagnósticas y cuál fue el resultado. Esta información nos ayudará a entender mejor tu perfil digestivo y personalizar tus recomendaciones.
            </Text>
            
            {/* Sección Endoscopia */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="scan" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Endoscopia Digestiva Alta</Text>
                </View>
                <Switch
                  trackColor={{ false: theme.colors.gray[300], true: theme.colors.secondary }}
                  thumbColor={hasEndoscopy ? theme.colors.primary : theme.colors.gray[100]}
                  onValueChange={setHasEndoscopy}
                  value={hasEndoscopy}
                />
              </View>
              
              <Text style={styles.sectionDescription}>
                La endoscopia es un procedimiento donde un tubo con cámara examina el esófago y estómago.
                Es útil para detectar lesiones o inflamación.
              </Text>
              
              {hasEndoscopy && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>¿Cuál fue el resultado?</Text>
                  
                  {endoscopyOptions.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        endoscopyResult === option.id && styles.selectedOption
                      ]}
                      onPress={() => setEndoscopyResult(option.id)}
                    >
                      <View style={styles.optionRow}>
                        <View style={styles.radioContainer}>
                          <View style={[
                            styles.radioOuter,
                            endoscopyResult === option.id && styles.radioOuterSelected
                          ]}>
                            {endoscopyResult === option.id && 
                              <View style={styles.radioInner} />
                            }
                          </View>
                        </View>
                        <Text style={[
                          styles.optionText,
                          endoscopyResult === option.id && styles.selectedOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Sección pH-metría */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="analytics" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>pH-metría</Text>
                </View>
                <Switch
                  trackColor={{ false: theme.colors.gray[300], true: theme.colors.secondary }}
                  thumbColor={hasPHMonitoring ? theme.colors.primary : theme.colors.gray[100]}
                  onValueChange={setHasPHMonitoring}
                  value={hasPHMonitoring}
                />
              </View>
              
              <Text style={styles.sectionDescription}>
              Esta prueba mide la acidez en el esófago durante 24 horas.
              Ayuda a determinar si hay reflujo ácido y con qué frecuencia ocurre.
              </Text>
              
              {hasPHMonitoring && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>¿Cuál fue el resultado?</Text>
                  
                  {phMonitoringOptions.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        phMonitoringResult === option.id && styles.selectedOption
                      ]}
                      onPress={() => setPHMonitoringResult(option.id)}
                    >
                      <View style={styles.optionRow}>
                        <View style={styles.radioContainer}>
                          <View style={[
                            styles.radioOuter,
                            phMonitoringResult === option.id && styles.radioOuterSelected
                          ]}>
                            {phMonitoringResult === option.id && 
                              <View style={styles.radioInner} />
                            }
                          </View>
                        </View>
                        <Text style={[
                          styles.optionText,
                          phMonitoringResult === option.id && styles.selectedOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Mensaje informativo */}
            <View style={styles.infoCard}>
              <Icon name="information-circle" size={20} color={theme.colors.info.main} style={styles.infoIcon} />
              <Text style={styles.infoText}>
              Si nunca te han realizado estas pruebas, no te preocupes.
              Podemos generar recomendaciones personalizadas basadas en tus síntomas y hábitos actuales.

              </Text>
            </View>
            
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
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  sectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  optionsContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  optionsLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
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
  infoCard: {
    backgroundColor: theme.colors.info.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start', // Cambiar de 'center' a 'flex-start'
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.info.dark,
    flex: 1,
    lineHeight: 20,
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