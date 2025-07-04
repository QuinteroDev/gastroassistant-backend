// src/screens/ForgotPasswordScreen.tsx - VERSIÓN PRODUCCIÓN (SIN DEBUG)
import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../utils/api';
import { theme } from '../constants/theme';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async () => {
    setError(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError('Por favor, introduce tu email');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, introduce un email válido');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Solicitando reset para:', email);
      
      const response = await api.post('/api/users/password-reset/request/', {
        email: email.trim(),
      });

      console.log('Reset solicitado exitosamente');
      setSuccess(true);

    } catch (err: any) {
      console.error('Error en solicitud de reset:', err);
      
      if (err.response?.status >= 500) {
        setError('Error del servidor. Inténtalo más tarde.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError(err.response?.data?.error || 'Error inesperado. Inténtalo de nuevo.');
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

  // 🎉 PANTALLA DE ÉXITO
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
            <Icon name="mail-outline" size={80} color={theme.colors.success.main} />
          </View>
          
          <Text style={styles.successTitle}>¡Email enviado!</Text>
          <Text style={styles.successText}>
            Hemos enviado las instrucciones para restablecer tu contraseña a:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          
          <Text style={styles.instructionText}>
            Revisa tu bandeja de entrada y sigue las instrucciones del email.
            El enlace es válido por 1 hora.
          </Text>

          <TouchableOpacity 
            style={styles.backToLoginButtonCentered}
            onPress={navigateToLogin}
          >
            <Icon name="arrow-back" size={20} color={theme.colors.surface} style={styles.backToLoginIcon} />
            <Text style={styles.backToLoginButtonText}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // 📱 PANTALLA PRINCIPAL
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
              <Icon name="lock-closed-outline" size={60} color={theme.colors.primary} />
            </View>

            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.subtitle}>
              No te preocupes, te enviaremos las instrucciones para restablecerla
            </Text>

            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Icon name="mail-outline" size={20} color={theme.colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Tu email registrado"
                  placeholderTextColor={theme.colors.input.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={18} color={theme.colors.error.main} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  isLoading && styles.sendButtonDisabled
                ]}
                onPress={handleRequestReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.colors.surface} size="small" />
                ) : (
                  <>
                    <Text style={styles.sendButtonText}>Enviar instrucciones</Text>
                    <Icon name="mail" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>

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
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
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
    marginBottom: theme.spacing.sm,
    lineHeight: 22,
  },
  emailText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  instructionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  backToLoginButtonCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    alignSelf: 'center',
    minWidth: 200,
  },
  backToLoginButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});