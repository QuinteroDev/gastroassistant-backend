// src/screens/RegisterScreen.tsx
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
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../utils/api';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

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
      
      const response = await api.post('/api/users/register/', {
        username,
        email,
        password
      });
  
      console.log("Respuesta del servidor:", response.status);
      
      if (response.status === 201 || response.status === 200) {
        console.log("Registro exitoso:", response.data);
        setMsg('¡Usuario registrado con éxito!');
        
        // Navegar a Login después de un breve retraso
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        setError('Respuesta inesperada del servidor. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      console.error("Error en el registro:", err);
      
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else if (err.response.data && err.response.data.username) {
          setError(`Error con el nombre de usuario: ${err.response.data.username.join(', ')}`);
        } else if (err.response.data && err.response.data.email) {
          setError(`Error con el correo electrónico: ${err.response.data.email.join(', ')}`);
        } else if (err.response.data && err.response.data.password) {
          setError(`Error con la contraseña: ${err.response.data.password.join(', ')}`);
        } else {
          setError(`Error ${err.response.status}: No se pudo completar el registro.`);
        }
      } else if (err.request) {
        setError('No se recibió respuesta del servidor. Comprueba tu conexión.');
      } else {
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
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a nuestra comunidad de bienestar</Text>

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
                <Icon name="mail-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={theme.colors.input.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
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

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Icon name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor={theme.colors.input.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
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

            {msg ? (
              <View style={styles.successContainer}>
                <Icon name="checkmark-circle" size={18} color={theme.colors.success.main} />
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
              {isLoading ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Crear cuenta</Text>
                  <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Icon name="shield-checkmark" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.termsText}>
                Al registrarte, aceptas nuestros{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => { 
                    Linking.openURL('https://lymbia.com/terms-of-service/');
                  }}
                >
                  Términos
                </Text>
                {' '}y{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => { 
                    Linking.openURL('https://lymbia.com/privacy-policy/');
                  }}
                >
                  Privacidad
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity onPress={goBackToLogin}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
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
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoBackground: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  logoTextContainer: {
    marginBottom: theme.spacing.xs,
  },
  logoText: {
    textAlign: 'center',
  },
  gastroText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  assistantText: {
    fontSize: 28,
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
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.light,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: theme.colors.success.main,
    fontSize: theme.fontSize.sm,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  termsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginLeft: theme.spacing.xs,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  loginLink: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});