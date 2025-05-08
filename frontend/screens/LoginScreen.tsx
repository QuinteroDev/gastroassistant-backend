// screens/LoginScreen.tsx
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
import { storeData, removeData } from '../utils/storage';
import api from '../utils/api';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Limpiar cualquier error cuando el usuario cambie los inputs
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [username, password]);

  // Limpiar token al cargar la pantalla
  useEffect(() => {
    const clearToken = async () => {
      try {
        await removeData('authToken');
        console.log("Token eliminado al iniciar pantalla de login");
      } catch (err) {
        console.error("Error al eliminar token:", err);
      }
    };
    
    clearToken();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log("==== INICIO DE LOGIN ====");
    console.log("Email/Username:", username);

    try {
      // Usar nuestro cliente API configurado
      const response = await api.post('/api/users/login/', {
        username,
        password,
      });

      // Procesar respuesta
      console.log("Respuesta status:", response.status);
      
      if (response.data && response.data.token) {
        console.log("Login exitoso, token recibido:", response.data.token.substring(0, 10) + '...');
        
        // Guardar el token
        await storeData('authToken', response.data.token);
        console.log("Token guardado correctamente");
        
        // Obtener el estado de onboarding inicial
        let onboardingCompleted = response.data.onboarding_complete === true;
        console.log("Valor inicial de onboarding_complete:", response.data.onboarding_complete);
        
        // Si el onboarding_complete es false, hacer una verificación adicional
        if (!onboardingCompleted) {
          try {
            // Obtener datos del perfil para verificar el estado real
            const profileResponse = await api.get('/api/profiles/me/');
            if (profileResponse.data && profileResponse.data.onboarding_complete === true) {
              console.log("Verificación adicional: onboarding_complete es TRUE en el perfil");
              onboardingCompleted = true;
            } else {
              console.log("Verificación adicional: onboarding_complete sigue siendo FALSE en el perfil");
            }
          } catch (profileErr) {
            console.error("No se pudo verificar el estado de onboarding en el perfil:", profileErr);
            // Seguimos con el valor original si hay error
          }
        }
        
        // También verificar si el usuario tiene un programa asignado
        if (!onboardingCompleted) {
          try {
            const programResponse = await api.get('/api/programs/my-program/');
            if (programResponse.data && programResponse.data.id) {
              console.log("Usuario tiene programa asignado, considerando onboarding como completado");
              onboardingCompleted = true;
            }
          } catch (programErr) {
            console.log("No se pudo verificar si existe un programa asignado:", programErr);
            // Seguimos con el valor original si hay error
          }
        }
        
        console.log("¿Onboarding completado? (valor final):", onboardingCompleted);
        
        // Navegar según estado de onboarding
        const destination = onboardingCompleted ? 'Home' : 'OnboardingWelcome';
        console.log("Navegando a:", destination);
        
        navigation.reset({
          index: 0,
          routes: [{ name: destination }],
        });
      } else {
        console.error("Respuesta sin token:", response.data);
        setError('Error en la respuesta del servidor. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error("Error en la petición de login:", err);
      
      // Manejar error de autenticación
      if (err.response && err.response.status === 400) {
        setError('Credenciales incorrectas. Revisa tu usuario y contraseña.');
      } else if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error de conexión. Por favor, inténtalo de nuevo.');
      }
    } finally {
      console.log("==== FIN DE LOGIN ====");
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
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
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>

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

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#D8000C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => console.log("Olvidé mi contraseña")}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#0077B6', '#00B4D8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              ¿No tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
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
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005f73',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#0077B6',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingBottom: 20,
  },
  registerText: {
    fontSize: 15,
    color: '#666',
    marginRight: 5,
  },
  registerLink: {
    fontSize: 15,
    color: '#0077B6',
    fontWeight: 'bold',
  },
});