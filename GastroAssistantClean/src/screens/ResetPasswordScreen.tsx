// src/screens/ResetPasswordScreen.tsx - VERSIÓN COMPLETA MEJORADA
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
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../utils/api';
import { theme } from '../constants/theme';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ResetPassword'
>;

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = route.params?.token;

  useEffect(() => {
    if (!token) {
      Alert.alert(
        'Error',
        'Token de restablecimiento no válido',
        [{ text: 'OK', onPress: () => navigateToLogin() }]
      );
    }
  }, [token]);

  const validatePassword = (pass: string) => {
    if (pass.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  };

  const handleResetPassword = async () => {
    setError(null);
    setIsLoading(true);

    // Validaciones
    if (!password || !confirmPassword) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Restableciendo contraseña con token:', token);
      
      const response = await api.post('/api/users/password-reset/confirm/', {
        token: token,
        new_password: password,
        confirm_password: confirmPassword,
      });

      console.log('Contraseña restablecida exitosamente');
      setSuccess(true);

    } catch (err: any) {
      console.error('Error en reset de contraseña:', err);
      
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Token inválido o expirado');
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

  const navigateToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // 🎉 PANTALLA DE ÉXITO MEJORADA
  if (success) {
    return (
      <LinearGradient
        colors={['#E6F7FF', '#CAF0F8', '#feffff']}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Icon name="checkmark-circle-outline" size={80} color={theme.colors.success.main} />
          </View>
          
          <Text style={styles.successTitle}>¡Contraseña cambiada!</Text>
          <Text style={styles.successText}>
            Tu contraseña ha sido actualizada exitosamente.
            Ya puedes iniciar sesión con tu nueva contraseña.
          </Text>

          {/* ✨ BOTÓN MEJORADO CENTRADO */}
          <TouchableOpacity 
            style={styles.loginButtonCentered}
            onPress={navigateToLogin}
          >
            <Text style={styles.loginButtonText}>Ir al login</Text>
            <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // 📱 PANTALLA PRINCIPAL MEJORADA
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
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBackButton}
              onPress={navigateToLogin}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="key-outline" size={60} color={theme.colors.primary} />
            </View>

            <Text style={styles.title}>Nueva contraseña</Text>
            <Text style={styles.subtitle}>
              Introduce tu nueva contraseña para completar el restablecimiento
            </Text>

            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Icon name="lock-closed-outline" size={20} color={theme.colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
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
                  <Icon name="lock-closed-outline" size={20} color={theme.colors.primary} />
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

              {/* Indicador de fortaleza de contraseña */}
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <Text style={styles.passwordStrengthLabel}>Fortaleza de la contraseña:</Text>
                  <View style={styles.passwordStrengthBar}>
                    <View 
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: `${Math.min((password.length / 8) * 100, 100)}%`,
                          backgroundColor: password.length < 6 
                            ? theme.colors.error.main 
                            : password.length < 8 
                              ? '#FFA500' 
                              : theme.colors.success.main
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.passwordStrengthText}>
                    {password.length < 6 
                      ? 'Muy débil' 
                      : password.length < 8 
                        ? 'Débil' 
                        : 'Fuerte'}
                  </Text>
                </View>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={18} color={theme.colors.error.main} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={[
                  styles.resetButton,
                  isLoading && styles.resetButtonDisabled
                ]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.colors.surface} size="small" />
                ) : (
                  <>
                    <Text style={styles.resetButtonText}>Cambiar contraseña</Text>
                    <Icon name="checkmark" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ✨ FOOTER MEJORADO */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ¿Recordaste tu contraseña?
              </Text>
              <TouchableOpacity 
                style={styles.backToLoginButton}
                onPress={navigateToLogin}
              >
                <Icon name="arrow-back" size={18} color={theme.colors.primary} style={styles.backToLoginIcon} />
                <Text style={styles.backToLoginText}>Volver al login</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerBackButton: {
    alignSelf: 'flex-start',
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
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
  passwordStrengthContainer: {
    marginBottom: theme.spacing.md,
  },
  passwordStrengthLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: theme.colors.border.light,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
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
  resetButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
  
  // ✨ ESTILOS MEJORADOS PARA FOOTER
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
    minWidth: 180,
  },
  backToLoginIcon: {
    marginRight: theme.spacing.sm,
  },
  backToLoginText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  
  // ✨ ESTILOS PARA PANTALLA DE ÉXITO
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.success.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  
  // ✨ BOTÓN CENTRADO PARA PANTALLA DE ÉXITO
  loginButtonCentered: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
    alignSelf: 'center',
    minWidth: 200,
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});