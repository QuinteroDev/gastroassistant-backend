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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GastroAvatar from '../components/GastroAvatar';
import api from '../utils/api';
import { storeData } from '../utils/storage'; // Importar el utilitario de almacenamiento multiplataforma

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Limpiar cualquier error cuando el usuario cambie los inputs
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [email, password]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // URL directa al servidor (usando localhost)
    const LOGIN_URL = 'http://127.0.0.1:8000/api/users/login/';
    
    console.log("==== INICIO DE LOGIN ====");
    console.log("Intentando login con URL:", LOGIN_URL);
    console.log("Email/Username:", email);

    try {
      // Usar fetch directamente para depuración
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      console.log("Respuesta status:", response.status);
      console.log("Respuesta OK:", response.ok);
      
      // Leer el texto completo de la respuesta
      const responseText = await response.text();
      console.log("Texto de respuesta:", responseText);
      
      if (responseText) {
        try {
          // Intentar parsear como JSON
          const data = JSON.parse(responseText);
          console.log("Datos JSON:", data);
          
          if (response.ok && data.token) {
            console.log("Login exitoso, token recibido");
            
            // Guardar el token usando nuestro utilitario multiplataforma
            await storeData('authToken', data.token);
            console.log("Token guardado correctamente");
            
            // Verificamos los campos exactos que vienen del backend
            console.log("Valor original de onboarding_complete:", data.onboarding_complete);
            
            // IMPORTANTE: Asegurarnos de acceder al campo correcto según la respuesta del backend
            const onboardingCompleted = data.onboarding_complete === true;
            console.log("Estado de onboarding_completed interpretado:", onboardingCompleted);
            
            // Navegar según el valor de onboarding_complete
            const destination = onboardingCompleted ? 'Home' : 'OnboardingWelcome';
            console.log("Navegando a:", destination);
            
            navigation.reset({
              index: 0,
              routes: [{ name: destination }],
            });
          } else {
            const errorMsg = data.detail || 'Error de inicio de sesión';
            console.log("Error en la respuesta:", errorMsg);
            setError(errorMsg);
          }
        } catch (e) {
          console.error("Error al parsear JSON:", e);
          setError('Error en el formato de respuesta');
        }
      } else {
        console.log("Respuesta vacía del servidor");
        setError('No se recibió respuesta del servidor');
      }
    } catch (err) {
      console.error("Error en la petición fetch:", err);
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <GastroAvatar size={100} />
            </View>
            <Text style={styles.logoText}>Gastro<Text style={styles.logoTextAccent}>Assistant</Text></Text>
            <Text style={styles.tagline}>Tu compañero para el bienestar digestivo</Text>
          </View>
          
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>

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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  logoWrapper: {
    backgroundColor: 'white',
    borderRadius: 60,
    padding: 10,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  logoTextAccent: {
    color: '#023E8A',
  },
  tagline: {
    fontSize: 14,
    color: '#0096C7',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formCard: {
    width: width * 0.88,
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
    marginBottom: 22,
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
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 10,
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
    marginTop: 20,
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