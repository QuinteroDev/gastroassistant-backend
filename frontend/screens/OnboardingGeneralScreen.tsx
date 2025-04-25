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
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent'; // Importamos el nuevo componente

// CONFIGURACIÓN API URL
const API_URL = 'http://192.168.1.48:8000';

type OnboardingGeneralNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingGeneral'>;

export default function OnboardingGeneralScreen() {
  const navigation = useNavigation<OnboardingGeneralNavigationProp>();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingGeneralScreen...");
      const token = await SecureStore.getItemAsync('authToken');
      console.log("Token en OnboardingGeneralScreen:", token ? "Existe" : "No existe");
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    
    checkAuth();
  }, [navigation]);

  const handleContinue = async () => {
    setError(null);
    setIsLoading(true);

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    if (isNaN(weightNum) || isNaN(heightNum) || weightNum <= 0 || heightNum <= 0) {
      setError('Por favor, introduce un peso (kg) y altura (cm) válidos.');
      setIsLoading(false);
      return;
    }

    let token: string | null = null;
    try {
      token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setError('Error crítico: No se encontró token. Por favor, inicia sesión de nuevo.');
        Alert.alert('Error de Autenticación', 'No se encontró token. Serás redirigido al Login.');
        // Redirigir a Login si no hay token
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/profiles/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight_kg: weightNum,
          height_cm: heightNum,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data?.error || data?.detail || `Error ${response.status}: No se pudo guardar el perfil.`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Perfil actualizado correctamente:", data);
      
      // Navegar al siguiente paso del onboarding
      navigation.navigate('OnboardingGerdQ');
    } catch (err) {
      console.error("Error en handleContinue:", err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error de red o conexión.';
      setError(message);
      
      // Si el error es de autenticación (401), redirigir al login
      if (message.includes('401') || message.includes('token')) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.', [
          { text: 'Ok', onPress: async () => {
            await SecureStore.deleteItemAsync('authToken');
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
      {/* Usamos nuestro nuevo componente de header */}
      <HeaderComponent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>Cuéntanos sobre ti</Text>
              <Text style={styles.subtitle}>Introduce tu peso y altura actuales</Text>

              <TextInput
                style={styles.input}
                placeholder="Peso (ej: 75.5)"
                placeholderTextColor="#999"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Altura (ej: 170)"
                placeholderTextColor="#999"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                editable={!isLoading}
              />

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

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              {/* Espacio extra al final para asegurar que el botón es visible con teclado */}
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
    height: 100, // Espacio extra para asegurar que el contenido se puede desplazar lo suficiente
  }
});