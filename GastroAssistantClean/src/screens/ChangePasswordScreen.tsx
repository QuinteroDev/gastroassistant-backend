import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MainHeaderComponent from '../components/MainHeaderComponent';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Tipos
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ProgramDetails: undefined;
  Profile: undefined;
  ChangePassword: undefined;
};

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ShowPasswords {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const { width } = Dimensions.get('window');

// Componente para indicador de fortaleza de contraseña
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const strengthColors = ['#E0E0E0', '#ff4444', '#ff9800', '#ffc107', '#4caf50'];
  const strengthLabels = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte'];

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[...Array(4)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i < strength ? strengthColors[strength] : '#E0E0E0' }
            ]}
          />
        ))}
      </View>
      {password && (
        <Text style={[styles.strengthText, { color: strengthColors[strength] }]}>
          {strengthLabels[strength]}
        </Text>
      )}
    </View>
  );
};

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState<ShowPasswords>({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const togglePasswordVisibility = (field: keyof ShowPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Ingresa una nueva contraseña';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      shakeAnimation();
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const response = await api.post('/api/users/change-password/', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      });

      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setSuccessMessage('¡Tu contraseña ha sido actualizada exitosamente!');
      
      // Animación de éxito
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      
      const errorMsg = error.response?.data?.error || 'Error al cambiar la contraseña';
      setErrorMessage(errorMsg);
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MainHeaderComponent showBackButton={true} />
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Icon name="lock-closed" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Cambiar Contraseña</Text>
          <Text style={styles.subtitle}>
            Mantén tu cuenta segura actualizando tu contraseña regularmente
          </Text>
        </View>

        <Animated.View 
          style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: shakeAnim }
              ],
            },
          ]}
        >
          {/* Contraseña actual */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Icon name="key-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>Contraseña actual</Text>
            </View>
            <View style={[
              styles.passwordContainer,
              errors.currentPassword && styles.inputError
            ]}>
              <TextInput
                style={styles.passwordInput}
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange('currentPassword', value)}
                placeholder="Ingresa tu contraseña actual"
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
                placeholderTextColor={theme.colors.text.secondary}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Icon
                  name={showPasswords.current ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={14} color={theme.colors.error.main} />
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              </View>
            )}
          </View>

          {/* Nueva contraseña */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Icon name="lock-open-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>Nueva contraseña</Text>
            </View>
            <View style={[
              styles.passwordContainer,
              errors.newPassword && styles.inputError
            ]}>
              <TextInput
                style={styles.passwordInput}
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                placeholder="Crea una contraseña segura"
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
                placeholderTextColor={theme.colors.text.secondary}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('new')}
              >
                <Icon
                  name={showPasswords.new ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={14} color={theme.colors.error.main} />
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              </View>
            )}
            <PasswordStrengthIndicator password={formData.newPassword} />
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Icon name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
            </View>
            <View style={[
              styles.passwordContainer,
              errors.confirmPassword && styles.inputError
            ]}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Repite tu nueva contraseña"
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
                placeholderTextColor={theme.colors.text.secondary}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirm')}
              >
                <Icon
                  name={showPasswords.confirm ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={14} color={theme.colors.error.main} />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            )}
          </View>

          {/* Tips de seguridad */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>
              <Icon name="shield-checkmark" size={16} color={theme.colors.primary} /> Tips de seguridad:
            </Text>
            <Text style={styles.tipText}>• Usa al menos 8 caracteres</Text>
            <Text style={styles.tipText}>• Incluye mayúsculas y minúsculas</Text>
            <Text style={styles.tipText}>• Añade números y símbolos</Text>
            <Text style={styles.tipText}>• No uses información personal</Text>
          </View>

          {/* Botón de cambiar contraseña */}
          <TouchableOpacity 
            style={[
              styles.submitButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="lock-closed" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Actualizar Contraseña</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Mensaje de éxito */}
        {successMessage && (
          <Animated.View 
            style={[
              styles.successMessage,
              {
                opacity: successAnim,
                transform: [{
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
              },
            ]}
          >
            <Icon name="checkmark-circle" size={24} color={theme.colors.success.main} />
            <Text style={styles.successText}>{successMessage}</Text>
          </Animated.View>
        )}

        {/* Mensaje de error */}
        {errorMessage && (
          <Animated.View style={[styles.errorMessage, { transform: [{ translateX: shakeAnim }] }]}>
            <Icon name="alert-circle" size={24} color={theme.colors.error.main} />
            <Text style={styles.errorMessageText}>{errorMessage}</Text>
          </Animated.View>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  eyeButton: {
    padding: theme.spacing.md,
  },
  inputError: {
    borderColor: theme.colors.error.main,
    backgroundColor: theme.colors.error.bg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error.main,
    fontSize: theme.fontSize.sm,
    marginLeft: 4,
  },
  strengthContainer: {
    marginTop: theme.spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: `${theme.colors.info.main}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  tipsTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.info.dark,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.info.dark,
    marginVertical: 2,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.bg,
    borderColor: theme.colors.success.main,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.success.dark,
    fontSize: theme.fontSize.base,
    flex: 1,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.bg,
    borderColor: theme.colors.error.main,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorMessageText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.error.dark,
    fontSize: theme.fontSize.base,
    flex: 1,
  },
  bottomSpacer: {
    height: 20,
  },
});