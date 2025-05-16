// screens/ChangePasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderComponent from '../components/HeaderComponent';
import api from '../utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ChangePasswordScreen({ navigation }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Estados para mensajes de éxito y error (igual que en TrackerScreen)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Función personalizada para volver al perfil - simplificada
  const navigateToProfile = () => {
    console.log('Navegando a Profile...');
    navigation.goBack();
  };

  // Detectar cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('ChangePasswordScreen focused');
      return () => {
        console.log('ChangePasswordScreen blurred');
      };
    }, [])
  );

  // Manejar cambios en los campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario comienza a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    // Limpiar mensajes de error al empezar a escribir
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Alternar visibilidad de contraseñas
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

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
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Limpiar mensajes previos
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const response = await api.post('/api/users/change-password/', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      });

      // Limpiar el formulario
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Mostrar mensaje de éxito como en TrackerScreen
      setSuccessMessage('Tu contraseña ha sido cambiada exitosamente');
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error:', error);
      
      // Mostrar mensaje de error usando el componente visual
      const errorMsg = error.response?.data?.error || 'Error al cambiar la contraseña';
      setErrorMessage(errorMsg);
      
      // Ocultar mensaje de error después de 5 segundos
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent 
        title="Cambiar Contraseña" 
        showBackButton={true} 
        onBackPress={navigateToProfile}
      />
      
      <ScrollView style={styles.contentContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.description}>
            Para tu seguridad, ingresa tu contraseña actual y luego establece una nueva contraseña.
          </Text>

          {/* Contraseña actual */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña actual</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.currentPassword && styles.inputError]}
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange('currentPassword', value)}
                placeholder="Ingresa tu contraseña actual"
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Ionicons
                  name={showPasswords.current ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* Nueva contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nueva contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.newPassword && styles.inputError]}
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                placeholder="Ingresa tu nueva contraseña"
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility('new')}
              >
                <Ionicons
                  name={showPasswords.new ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
            <Text style={styles.hintText}>
              La contraseña debe tener al menos 6 caracteres
            </Text>
          </View>

          {/* Confirmar nueva contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirma tu nueva contraseña"
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility('confirm')}
              >
                <Ionicons
                  name={showPasswords.confirm ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Botón de cambiar contraseña */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Mensaje de éxito - igual que en TrackerScreen */}
          {successMessage && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Mensaje de error */}
          {errorMessage && (
            <View style={styles.errorMessage}>
              <Ionicons name="alert-circle" size={20} color="#d32f2f" />
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  inputError: {
    borderColor: '#d32f2f',
    backgroundColor: '#fcf3f3',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
  },
  hintText: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#0077B6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Estilos para mensajes (copiados del TrackerScreen)
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  successText: {
    marginLeft: 8,
    color: '#155724',
    fontSize: 14,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorMessageText: {
    marginLeft: 8,
    color: '#721c24',
    fontSize: 14,
  },
});