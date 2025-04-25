// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';

// URL Base para la API
const API_URL = 'http://192.168.1.48:8000';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Intentando login con:", { email, password });
      
      // Usar username para el login como lo espera el backend
      const response = await fetch(`${API_URL}/api/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email, // Usando email como username
          password: password,
        }),
      });

      console.log("Respuesta status:", response.status);
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.log("No se pudo parsear la respuesta como JSON:", responseText);
        data = { detail: responseText };
      }

      if (response.ok) {
        console.log('Login exitoso:', data);
        
        if (data.token) {
          // Guardar el token en el almacenamiento seguro
          await SecureStore.setItemAsync('authToken', data.token);
          console.log('Token guardado correctamente');
          
          // Comprobar si el usuario ya completó el onboarding
          if (data.onboarding_completed) {
            // Navegar a Home si ya completó el onboarding
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } else {
            // Navegar a la pantalla de onboarding si no lo ha completado
            navigation.reset({
              index: 0,
              routes: [{ name: 'OnboardingGeneral' }],
            });
          }
        } else {
          throw new Error('No se recibió token en la respuesta');
        }
      } else {
        // Manejar errores específicos de la API
        const errorMessage = data.detail || 'Error de inicio de sesión. Verifica tus credenciales.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error en el inicio de sesión:', err);
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#0077B6" style={styles.activityIndicator} />
          ) : (
            <Button title="Iniciar Sesión" onPress={handleLogin} disabled={isLoading} />
          )}

          <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
            <Text style={styles.registerText}>
              ¿No tienes una cuenta? <Text style={styles.registerLink}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
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
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  activityIndicator: {
    marginVertical: 20,
  },
  errorText: {
    color: '#D8000C',
    backgroundColor: '#FFD2D2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlign: 'center',
  },
  registerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },
  registerLink: {
    color: '#0077B6',
    fontWeight: 'bold',
  },
});