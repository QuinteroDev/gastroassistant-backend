// src/screens/OnboardingGeneralScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  TextInput, 
  StyleSheet,
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import HeaderComponent from '../components/HeaderComponent';
import ProgressBar from '../components/ProgressBar';
import { getData, storeData, saveOnboardingProgress } from '../utils/storage';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Tipos temporales - después los movemos a archivo separado
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ProgramDetails: undefined;  // Añadir esta línea
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
  OnboardingGerdQ: undefined;
  OnboardingRsi: undefined;
  OnboardingClinicalFactors: undefined;
  OnboardingDiagnosticTests: undefined;
  OnboardingHabits: undefined;
  GeneratingProgram: undefined;
};

type OnboardingGeneralNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingGeneral'>;

// Interfaz para la información del perfil
interface ProfileData {
  weight_kg: number;
  height_cm: number;
  user: {
    first_name: string;
  };
}

export default function OnboardingGeneralScreen() {
  const navigation = useNavigation<OnboardingGeneralNavigationProp>();
  
  // Estado del formulario
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  // Estado de la UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingGeneralScreen...");
      const token = await getData('authToken');
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'ProgramDetails' }],
        });
        return;
      }
      
      // Guardamos la pantalla actual
      await saveOnboardingProgress('OnboardingGeneral');
      
      // Obtener datos del perfil si existe
      try {
        const response = await api.get('/api/profiles/me/');
        console.log("Perfil obtenido:", response.data);
        
        // Verificar si el onboarding ya está completo
        if (response.data && response.data.onboarding_complete) {
          console.log("Onboarding ya completado, redirigiendo a Home...");
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }
        
        // Pre-cargar los datos si existen
        if (response.data) {
          if (response.data.user && response.data.user.first_name) {
            setName(response.data.user.first_name);
          }
          if (response.data.weight_kg) {
            setWeight(response.data.weight_kg.toString());
          }
          if (response.data.height_cm) {
            setHeight(response.data.height_cm.toString());
          }
        }
      } catch (error) {
        console.error("Error al obtener perfil:", error);
        // No redirigimos en caso de error, permitimos continuar con el formulario vacío
      }
    };

    checkAuth();
  }, [navigation]);

  // Validación de datos del formulario
  const validateForm = (): boolean => {
    // Validar nombre
    if (!name.trim()) {
      setError('Por favor, introduce tu nombre o alias.');
      return false;
    }

    // Validar peso y altura
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    if (isNaN(weightNum) || isNaN(heightNum) || weightNum <= 0 || heightNum <= 0) {
      setError('Por favor, introduce un peso (kg) y altura (cm) válidos.');
      return false;
    }

    return true;
  };

  // Actualizar perfil (conectado al backend)
  const updateProfile = async (profileData: ProfileData): Promise<any> => {
    try {
      // Obtenemos el token de autenticación
      const token = await getData('authToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      // Enviamos los datos al servidor real usando el endpoint correcto
      console.log("Enviando datos al servidor:", profileData);
      const response = await api.patch('/api/profiles/me/', profileData);
      
      console.log("Respuesta del servidor:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      throw error;
    }
  };

  // Manejar el envío del formulario
  const handleContinue = async () => {
    setError(null);
    setIsLoading(true);

    // Validar formulario
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Verificar token
      const token = await getData('authToken');
      if (!token) {
        setError('Error crítico: No se encontró token. Por favor, inicia sesión de nuevo.');
        Alert.alert('Error de Autenticación', 'No se encontró token. Serás redirigido al Login.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      // Preparar datos del perfil
      const profileData: ProfileData = {
        user: {
          first_name: name
        },
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height)
      };

      // Enviar actualización al servidor
      const profileResponse = await updateProfile(profileData);
      console.log("Perfil actualizado correctamente:", profileResponse);
      
      // Guardar nombre en almacenamiento local para uso posterior
      await storeData('userName', name);
      
      // Guardar el progreso del onboarding antes de navegar
      await saveOnboardingProgress('OnboardingGerdQ');
      
      // Navegar al siguiente paso del onboarding
      navigation.navigate('OnboardingGerdQ');
    } catch (err: any) {
      console.error("Error en handleContinue:", err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error de red o conexión.';
      setError(message);
      
      // Si el error es de autenticación, redirigir al login
      if (message.includes('401') || message.includes('token')) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.', [
          { text: 'Ok', onPress: async () => {
            await storeData('authToken', '');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        ]);
      } else {
        Alert.alert('Error de Conexión', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderComponent 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />

      <ProgressBar 
        currentStep={ONBOARDING_STEPS.GENERAL} 
        totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
              <View style={styles.iconContainer}>
                <Icon name="person-circle-outline" size={60} color={theme.colors.primary} />
              </View>
              
              <Text style={styles.title}>Cuéntanos sobre ti</Text>
              <Text style={styles.subtitle}>Información básica para personalizar tu experiencia</Text>

              <View style={styles.formCard}>
                {/* Nombre o alias */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>¿Cómo te llamas?</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="person-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Tu nombre o alias"
                      placeholderTextColor={theme.colors.input.placeholder}
                      value={name}
                      onChangeText={setName}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Peso */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>¿Cuál es tu peso actual?</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="fitness-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Peso en kg (ej: 75.5)"
                      placeholderTextColor={theme.colors.input.placeholder}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      editable={!isLoading}
                    />
                    <Text style={styles.inputUnit}>kg</Text>
                  </View>
                </View>

                {/* Altura */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>¿Cuál es tu altura?</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="resize-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Altura en cm (ej: 170)"
                      placeholderTextColor={theme.colors.input.placeholder}
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                    <Text style={styles.inputUnit}>cm</Text>
                  </View>
                </View>
              </View>

              {/* Mostrar errores si existen */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={18} color={theme.colors.error.main} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Botón de continuar o indicador de carga */}
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.activityIndicator} />
              ) : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleContinue}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>Continuar</Text>
                  <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
                </TouchableOpacity>
              )}
              
              {/* Espacio extra al final para asegurar que el contenido es visible con teclado */}
              <View style={styles.bottomPadding} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
  formContainer: {
    padding: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  inputUnit: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  activityIndicator: {
    marginVertical: theme.spacing.xl,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.light,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error.main,
    fontSize: theme.fontSize.sm,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  }
});