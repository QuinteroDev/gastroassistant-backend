import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MainHeaderComponent from '../components/MainHeaderComponent';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Tipos
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ProgramDetails: undefined;
  Profile: undefined;
  ProfileUpdate: undefined;
};

type ProfileUpdateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileUpdate'>;

interface FormData {
  weight_kg: string;
  height_cm: string;
  has_endoscopy: boolean;
  endoscopy_result: string;
  has_ph_monitoring: boolean;
  ph_monitoring_result: string;
}

const { width } = Dimensions.get('window');

// Componente para mostrar el IMC calculado
const BMIDisplay = ({ weight, height }: { weight: string; height: string }) => {
  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w && h) {
      const bmi = w / ((h / 100) * (h / 100));
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMIInfo = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Bajo peso', color: theme.colors.info.main };
    if (bmi < 25) return { label: 'Peso normal', color: theme.colors.success.main };
    if (bmi < 30) return { label: 'Sobrepeso', color: theme.colors.warning.main };
    return { label: 'Obesidad', color: theme.colors.error.main };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMIInfo(parseFloat(bmi)) : null;

  if (!bmi) return null;

  return (
    <View style={styles.bmiContainer}>
      <View style={styles.bmiCard}>
        <Icon name="speedometer-outline" size={24} color={bmiInfo?.color} />
        <View style={styles.bmiInfo}>
          <Text style={styles.bmiLabel}>IMC Calculado</Text>
          <Text style={[styles.bmiValue, { color: bmiInfo?.color }]}>{bmi}</Text>
          <Text style={[styles.bmiStatus, { color: bmiInfo?.color }]}>{bmiInfo?.label}</Text>
        </View>
      </View>
    </View>
  );
};

export default function ProfileUpdateScreen() {
  const navigation = useNavigation<ProfileUpdateScreenNavigationProp>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    weight_kg: '',
    height_cm: '',
    has_endoscopy: false,
    endoscopy_result: 'NORMAL',
    has_ph_monitoring: false,
    ph_monitoring_result: 'NEGATIVE'
  });
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadProfileData();
  }, []);
  
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
  }, [isLoading]);
  
  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/profiles/me/');
      
      if (response.data) {
        setFormData({
          weight_kg: response.data.weight_kg ? response.data.weight_kg.toString() : '',
          height_cm: response.data.height_cm ? response.data.height_cm.toString() : '',
          has_endoscopy: response.data.has_endoscopy || false,
          endoscopy_result: response.data.endoscopy_result || 'NORMAL',
          has_ph_monitoring: response.data.has_ph_monitoring || false,
          ph_monitoring_result: response.data.ph_monitoring_result || 'NEGATIVE'
        });
      }
    } catch (error) {
      console.error("Error al cargar datos del perfil:", error);
      setErrorMessage("No se pudieron cargar tus datos. Por favor, intenta de nuevo.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  const handleSwitchChange = (field: 'has_endoscopy' | 'has_ph_monitoring', value: boolean) => {
    if (field === 'has_endoscopy' && !value) {
      setFormData(prevData => ({
        ...prevData,
        has_endoscopy: value,
        endoscopy_result: 'NORMAL'
      }));
    } else if (field === 'has_ph_monitoring' && !value) {
      setFormData(prevData => ({
        ...prevData,
        has_ph_monitoring: value,
        ph_monitoring_result: 'NEGATIVE'
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
    
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (formData.weight_kg) {
      const weight = Number(formData.weight_kg);
      if (isNaN(weight)) errors.push("El peso debe ser un número válido");
      else if (weight < 30) errors.push("El peso debe ser mayor a 30 kg");
      else if (weight > 250) errors.push("El peso debe ser menor a 250 kg");
    }
    
    if (formData.height_cm) {
      const height = Number(formData.height_cm);
      if (isNaN(height)) errors.push("La altura debe ser un número válido");
      else if (height < 100) errors.push("La altura debe ser mayor a 100 cm");
      else if (height > 240) errors.push("La altura debe ser menor a 240 cm");
    }
    
    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'));
      return false;
    }
    
    return true;
  };
  
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      setIsSaving(true);
      
      // Animación de guardado
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
      
      const dataToSend = {
        ...formData,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null
      };
      
      const response = await api.patch('/api/profiles/me/', dataToSend);
      
      if (response.status === 200) {
        rotateAnim.stopAnimation();
        rotateAnim.setValue(0);
        
        setSuccessMessage("¡Tus datos han sido actualizados exitosamente!");
        
        // Animación de éxito
        Animated.spring(successAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
      
      const errorMsg = error.response?.data?.error || "No se pudo actualizar tu perfil. Por favor, intenta de nuevo.";
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };
  
  const endoscopyOptions = [
    { value: 'NORMAL', label: 'Normal', icon: 'checkmark-circle', color: theme.colors.success.main },
    { value: 'ESOPHAGITIS_A', label: 'Esofagitis Grado A', icon: 'alert-circle', color: theme.colors.warning.light },
    { value: 'ESOPHAGITIS_B', label: 'Esofagitis Grado B', icon: 'alert-circle', color: theme.colors.warning.main },
    { value: 'ESOPHAGITIS_C', label: 'Esofagitis Grado C', icon: 'warning', color: theme.colors.warning.dark },
    { value: 'ESOPHAGITIS_D', label: 'Esofagitis Grado D', icon: 'warning', color: theme.colors.error.main }
  ];
  
  const phOptions = [
    { value: 'NEGATIVE', label: 'Negativo', subtitle: 'Sin reflujo patológico', icon: 'checkmark-circle', color: theme.colors.success.main },
    { value: 'POSITIVE', label: 'Positivo', subtitle: 'Reflujo confirmado', icon: 'alert-circle', color: theme.colors.warning.main },
    { value: 'UNKNOWN', label: 'No concluyente', subtitle: 'Resultado indeterminado', icon: 'help-circle', color: theme.colors.info.main }
  ];
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <MainHeaderComponent showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tus datos...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent showBackButton={true} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="clipboard-text" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Actualizar Datos Clínicos</Text>
            <Text style={styles.headerSubtitle}>
              Mantén tu información médica actualizada para recibir mejores recomendaciones
            </Text>
          </View>
          
          {/* Medidas Corporales */}
          <Animated.View 
            style={[
              styles.sectionCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="weight" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Medidas Corporales</Text>
            </View>
            
            <View style={styles.measurementsRow}>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Icon name="person-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.inputLabel}>Peso (kg)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.weight_kg}
                  onChangeText={(value) => handleInputChange('weight_kg', value)}
                  placeholder="70"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Icon name="resize-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.inputLabel}>Altura (cm)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.height_cm}
                  onChangeText={(value) => handleInputChange('height_cm', value)}
                  placeholder="170"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            </View>
            
            <BMIDisplay weight={formData.weight_kg} height={formData.height_cm} />
          </Animated.View>
          
          {/* Pruebas Médicas */}
          <Animated.View 
            style={[
              styles.sectionCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="test-tube" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Pruebas Médicas</Text>
            </View>
            
            {/* Endoscopia */}
            <View style={styles.testSection}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <MaterialCommunityIcons name="stomach" size={20} color={theme.colors.primary} />
                  <Text style={styles.switchLabel}>¿Te has realizado una endoscopia?</Text>
                </View>
                <Switch
                  value={formData.has_endoscopy}
                  onValueChange={(value) => handleSwitchChange('has_endoscopy', value)}
                  trackColor={{ false: '#E0E0E0', true: `${theme.colors.primary}50` }}
                  thumbColor={formData.has_endoscopy ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              {formData.has_endoscopy && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsTitle}>Resultado de la endoscopia:</Text>
                  {endoscopyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionCard,
                        formData.endoscopy_result === option.value && styles.optionCardSelected
                      ]}
                      onPress={() => handleInputChange('endoscopy_result', option.value)}
                    >
                      <Icon 
                        name={option.icon as any} 
                        size={24} 
                        color={formData.endoscopy_result === option.value ? option.color : theme.colors.text.secondary} 
                      />
                      <Text style={[
                        styles.optionText,
                        formData.endoscopy_result === option.value && { color: theme.colors.text.primary, fontWeight: '600' }
                      ]}>
                        {option.label}
                      </Text>
                      {formData.endoscopy_result === option.value && (
                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* pH-metría */}
            <View style={styles.testSection}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <MaterialIcons name="analytics" size={20} color={theme.colors.primary} />
                  <Text style={styles.switchLabel}>¿Te has realizado una pH-metría?</Text>
                </View>
                <Switch
                  value={formData.has_ph_monitoring}
                  onValueChange={(value) => handleSwitchChange('has_ph_monitoring', value)}
                  trackColor={{ false: '#E0E0E0', true: `${theme.colors.primary}50` }}
                  thumbColor={formData.has_ph_monitoring ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              {formData.has_ph_monitoring && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsTitle}>Resultado de la pH-metría:</Text>
                  {phOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionCard,
                        formData.ph_monitoring_result === option.value && styles.optionCardSelected,
                        styles.optionCardWithSubtitle
                      ]}
                      onPress={() => handleInputChange('ph_monitoring_result', option.value)}
                    >
                      <Icon 
                        name={option.icon as any} 
                        size={24} 
                        color={formData.ph_monitoring_result === option.value ? option.color : theme.colors.text.secondary} 
                      />
                      <View style={styles.optionTextContainer}>
                        <Text style={[
                          styles.optionText,
                          formData.ph_monitoring_result === option.value && { color: theme.colors.text.primary, fontWeight: '600' }
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      </View>
                      {formData.ph_monitoring_result === option.value && (
                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
          
          {/* Botón Guardar */}
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <Animated.View
                style={{
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }}
              >
                <Icon name="sync" size={20} color="#ffffff" />
              </Animated.View>
            ) : (
              <>
                <Icon name="save-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Mensajes */}
          {successMessage && (
            <Animated.View 
              style={[
                styles.successMessage,
                {
                  opacity: successAnim,
                  transform: [{
                    scale: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }]
                }
              ]}
            >
              <Icon name="checkmark-circle" size={24} color={theme.colors.success.main} />
              <Text style={styles.successText}>{successMessage}</Text>
            </Animated.View>
          )}
          
          {errorMessage && (
            <View style={styles.errorMessage}>
              <Icon name="alert-circle" size={24} color={theme.colors.error.main} />
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
  },
  
  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Secciones
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  // Medidas
  measurementsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.base,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    color: theme.colors.text.primary,
  },
  
  // BMI Display
  bmiContainer: {
    marginTop: theme.spacing.md,
  },
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  bmiInfo: {
    marginLeft: theme.spacing.md,
  },
  bmiLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  bmiValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
  },
  bmiStatus: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
  },
  
  // Pruebas
  testSection: {
    marginBottom: theme.spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  optionsContainer: {
    marginTop: theme.spacing.sm,
  },
  optionsTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionCardWithSubtitle: {
    paddingVertical: theme.spacing.md,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  optionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  
  // Botón
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  
  // Mensajes
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.bg,
    borderColor: theme.colors.success.main,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.md,
  },
  errorMessageText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.error.dark,
    fontSize: theme.fontSize.base,
    flex: 1,
    lineHeight: 20,
  },
  
  bottomSpacer: {
    height: 30,
  },
});