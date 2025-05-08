// screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';

const { width, height } = Dimensions.get('window');

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Limpiar cualquier error cuando el usuario cambie los inputs
  useEffect(() => {
    if (error) {
      setError('');
    }
    if (msg) {
      setMsg('');
    }
  }, [username, email, password, confirmPassword]);

  const handleRegister = async () => {
    console.log('Se pulsó el botón "Crear cuenta"');

    // Validaciones previas
    if (!username || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, introduce un correo electrónico válido.');
      return;
    }

    // Validación de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMsg('');
  
    try {
      console.log("Enviando solicitud de registro al servidor...");
      console.log("Username:", username);
      console.log("Email:", email);
      
      // Usar nuestro cliente API configurado
      const response = await api.post('/api/users/register/', {
        username,
        email,
        password
      });
  
      console.log("Respuesta del servidor:", response.status);
      
      // Procesar respuesta
      if (response.status === 201 || response.status === 200) {
        // Si todo va bien
        console.log("Registro exitoso:", response.data);
        setMsg('¡Usuario registrado con éxito!');
        
        // Navegar a Login después de un breve retraso
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        console.warn("Respuesta inesperada:", response.status, response.data);
        setError('Respuesta inesperada del servidor. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error("Error en el registro:", err);
      
      // Manejar errores de respuesta
      if (err.response) {
        // El servidor respondió con un código de error
        console.error("Error de respuesta:", err.response.status, err.response.data);
        
        if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else if (err.response.data && err.response.data.username) {
          // Error de usuario ya existente
          setError(`Error con el nombre de usuario: ${err.response.data.username.join(', ')}`);
        } else if (err.response.data && err.response.data.email) {
          // Error de email ya existente
          setError(`Error con el correo electrónico: ${err.response.data.email.join(', ')}`);
        } else if (err.response.data && err.response.data.password) {
          // Error de contraseña
          setError(`Error con la contraseña: ${err.response.data.password.join(', ')}`);
        } else if (err.response.data && err.response.data.detail) {
          // Otro error con detalle
          setError(err.response.data.detail);
        } else {
          // Error genérico con código de estado
          setError(`Error ${err.response.status}: No se pudo completar el registro.`);
        }
      } else if (err.request) {
        // No se recibió respuesta del servidor
        console.error("Error de solicitud (sin respuesta):", err.request);
        setError('No se recibió respuesta del servidor. Comprueba tu conexión.');
      } else {
        // Error en la configuración de la solicitud
        console.error("Error:", err.message);
        setError('Error de conexión. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient
      colors={['#E6F7FF', '#CAF0F8', '#90E0EF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>
                <Text style={styles.gastroText}>Gastro</Text>
                <Text style={styles.assistantText}>Assistant</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>Tu compañero para el bienestar digestivo</Text>
          </View>
          
          <View style={styles.formCard}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a nuestra comunidad de bienestar digestivo</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color="#0077B6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#0077B6" style={styles.inputIcon} />
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
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#0077B6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#0077B6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#D8000C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {msg ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.successText}>{msg}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#0077B6', '#00B4D8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Crear cuenta</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              ¿Ya tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={goBackToLogin}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Al registrarte, aceptas nuestros{' '}
              <Text style={styles.termsLink}>Términos y Condiciones</Text>
              {' '}y{' '}
              <Text style={styles.termsLink}>Política de Privacidad</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 40,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 5,
  },
  logoTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    marginBottom: 5,
  },
  gastroText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0077B6',
    letterSpacing: 0.5,
  },
  assistantText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#023E8A',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#0096C7',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  formCard: {
    width: Platform.OS === 'web' ? Math.min(400, width * 0.9) : width * 0.88,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    paddingBottom: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#0096C7',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E7EE',
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDADD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    color: '#D8000C',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingBottom: 5,
  },
  loginText: {
    fontSize: 15,
    color: '#666',
    marginRight: 5,
  },
  loginLink: {
    fontSize: 15,
    color: '#0077B6',
    fontWeight: 'bold',
  },
  termsContainer: {
    marginTop: 15,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#0077B6',
    textDecorationLine: 'underline',
  }
});