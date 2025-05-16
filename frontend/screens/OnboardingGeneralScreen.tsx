// screens/OnboardingGeneralScreen.tsx
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
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import { getData, storeData, saveOnboardingProgress } from '../utils/storage';
import api from '../utils/api'; // Importamos la API
import ProgressBar from '../components/ProgressBar';
import { ONBOARDING_STEPS } from '../constants/onboarding';

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
          routes: [{ name: 'Login' }],
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
      
      // Si estamos en web y es un entorno de desarrollo, simulamos una respuesta exitosa
      if (Platform.OS === 'web' && __DEV__) {
        console.log("Simulando respuesta exitosa en entorno web de desarrollo");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, data: profileData };
      }
      
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
      
      // Navegar a la siguiente pantalla
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
      {/* Header con flecha de regreso visible - Ya no pasamos el título */}
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
              <Text style={styles.title}>Cuéntanos sobre ti</Text>
              <Text style={styles.subtitle}>Información básica para personalizar tu experiencia</Text>

              {/* Nombre o alias */}
              <Text style={styles.fieldLabel}>¿Cómo te llamas?</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre o alias"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />

              {/* Peso */}
              <Text style={styles.fieldLabel}>¿Cuál es tu peso actual?</Text>
              <TextInput
                style={styles.input}
                placeholder="Peso en kg (ej: 75.5)"
                placeholderTextColor="#999"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />

              {/* Altura */}
              <Text style={styles.fieldLabel}>¿Cuál es tu altura?</Text>
              <TextInput
                style={styles.input}
                placeholder="Altura en cm (ej: 170)"
                placeholderTextColor="#999"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                editable={!isLoading}
              />

              {/* Botón de continuar o indicador de carga */}
              {isLoading ? (
                <ActivityIndicator size="large" color="#0077B6" style={styles.activityIndicator} />
              ) : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleContinue}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    Continuar
                  </Text>
                </TouchableOpacity>
              )}

              {/* Mostrar errores si existen */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
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
    backgroundColor: '#E6F7FF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#005f73',
  },
  subtitle: {
    fontSize: 16,
    color: '#0077B6',
    marginBottom: 30,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#005f73',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
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
  errorText: {
    color: '#D8000C',
    backgroundColor: '#FFD2D2',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    textAlign: 'center',
    width: '100%',
  },
  bottomPadding: {
    height: 100,
  }
});