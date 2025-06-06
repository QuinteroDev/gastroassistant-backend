// src/screens/LoginScreen.tsx
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
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { storeData, removeData, getOnboardingProgress } from '../utils/storage';
import api from '../utils/api';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

// Tipos de navegación
type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ProgramDetails: undefined;  
    OnboardingWelcome: undefined;
    OnboardingGeneral: undefined;
    OnboardingGerdQ: undefined;
    OnboardingRsi: undefined;
    OnboardingClinicalFactors: undefined;
    OnboardingDiagnosticTests: undefined;
    OnboardingHabits: undefined;
    GeneratingProgram: undefined;
  };

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
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Intento de login:', { usuario: username });
      
      const response = await api.post('/api/users/login/', {
        username: username.trim(),
        password: password,
      });

      console.log('Login exitoso para', username);

      if (response.data.token) {
        // Guardar token y datos de usuario
        await storeData('authToken', response.data.token);
        await storeData('username', username.trim());

        // Tu API ya devuelve la información del onboarding
        const { has_profile, onboarding_complete } = response.data;
        
        console.log('Datos del API:', {
          has_profile,
          onboarding_complete
        });

        if (has_profile && onboarding_complete) {
          // Onboarding completo - ir a Home
          console.log('Onboarding completo, navegando a Programas');
          navigation.reset({
            index: 0,
            routes: [{ name: 'ProgramDetails' }],
          });
        } else {
          // Onboarding no completo - verificar dónde se quedó
          const lastOnboardingScreen = await getOnboardingProgress();
          console.log('Progreso de onboarding recuperado:', lastOnboardingScreen);
          
          if (lastOnboardingScreen) {
            // Volver a la pantalla donde se quedó
            console.log(`Continuando onboarding en: ${lastOnboardingScreen}`);
            navigation.reset({
              index: 0,
              routes: [{ name: lastOnboardingScreen as any }],
            });
          } else {
            // No hay progreso guardado - empezar onboarding desde welcome
            console.log('Empezando onboarding desde el inicio');
            navigation.reset({
              index: 0,
              routes: [{ name: 'OnboardingWelcome' }],
            });
          }
        }
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      
      if (err.response?.status === 401) {
        setError('Usuario o contraseña incorrectos');
      } else if (err.response?.status >= 500) {
        setError('Error del servidor. Inténtalo más tarde.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError('Error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={['#E6F7FF', '#CAF0F8', '#feffff']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
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
            <Text style={styles.welcomeSubtext}>Inicia sesión para continuar</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Icon name="person-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor={theme.colors.input.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Icon name="lock-closed-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={theme.colors.input.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.colors.input.placeholder} 
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={18} color={theme.colors.error.main} />
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
              {isLoading ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={navigateToRegister}
            >
              <Icon name="person-add-outline" size={20} color={theme.colors.primary} style={styles.registerIcon} />
              <Text style={styles.registerButtonText}>Crear cuenta nueva</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al iniciar sesión, aceptas nuestros{' '}
              <Text style={styles.footerLink}>Términos de Servicio</Text>
              {' '}y{' '}
              <Text style={styles.footerLink}>Política de Privacidad</Text>
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
    backgroundColor: theme.colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBackground: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoTextContainer: {
    marginBottom: theme.spacing.xs,
  },
  logoText: {
    textAlign: 'center',
  },
  gastroText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  assistantText: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.secondary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  welcomeText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    height: 56,
    paddingHorizontal: theme.spacing.xs,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.md,
  },
  passwordToggle: {
    padding: theme.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.light,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error.main,
    fontSize: theme.fontSize.sm,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  dividerText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    marginHorizontal: theme.spacing.md,
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerIcon: {
    marginRight: theme.spacing.sm,
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});