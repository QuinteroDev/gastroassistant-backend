// src/screens/OnboardingGeneralUpdateScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import HeaderComponent from '../components/HeaderComponent';
import ProgressBar from '../components/ProgressBar';
import api from '../utils/api';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import { saveOnboardingProgress, getData } from '../utils/storage'; // ← Agregar getData


type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingGeneralUpdate'>;

export default function OnboardingGeneralUpdateScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      console.log("Verificando token en OnboardingGeneralUpdateScreen...");
      
      // 1. Verificar token
      const token = await getData('authToken');
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // 2. Guardar progreso actual
      await saveOnboardingProgress('OnboardingGeneralUpdate');
      console.log("Progreso guardado: OnboardingGeneralUpdate");
      
      // 3. Cargar datos del usuario
      loadUserData();
    };
    
    checkAuthAndLoadData();
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const response = await api.get('/api/profiles/me/');
      setUserData(response.data);
      if (response.data.weight_kg) {
        setWeight(response.data.weight_kg.toString());
      }
      if (response.data.height_cm) {
        setHeight(response.data.height_cm.toString());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleContinue = async () => {
    // Validación
    if (!weight || !height) {
      Alert.alert('Datos incompletos', 'Por favor ingresa tu peso y altura actual');
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    
    if (isNaN(weightNum) || isNaN(heightNum) || weightNum <= 0 || heightNum <= 0) {
      Alert.alert('Datos inválidos', 'Por favor ingresa valores válidos para peso y altura');
      return;
    }

    setIsLoading(true);
    try {
      // Actualizar solo peso y altura
      await api.patch('/api/profiles/me/', {
        weight_kg: weightNum,
        height_cm: heightNum
      });

      // Guardar progreso y continuar
      await saveOnboardingProgress('OnboardingGerdQ');
      (navigation as any).navigate('OnboardingGerdQ', { isRenewal: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const userName = userData?.first_name || userData?.username || 'Usuario';

  return (
    <View style={styles.container}>
      <HeaderComponent 
        title="Evaluación Mensual" 
        showBackButton={false}
      />
      
      <ProgressBar 
        currentStep={ONBOARDING_STEPS.GENERAL} 
        totalSteps={ONBOARDING_STEPS.TOTAL_STEPS - 1} // Un paso menos
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeCard}>
            <View style={styles.iconCircle}>
              <Icon name="refresh-circle" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>
              ¡Hola de nuevo, {userName}!
            </Text>
            <Text style={styles.welcomeText}>
              Han pasado 30 días desde tu última evaluación. Es momento de actualizar tu información para ajustar tu programa.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="scale-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Actualiza tus datos</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              ¿Ha cambiado tu peso o altura en el último mes?
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso actual</Text>
              <View style={styles.inputContainer}>
                <Icon name="fitness-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="Peso en kg"
                  placeholderTextColor={theme.colors.input.placeholder}
                  editable={!isLoading}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Altura actual</Text>
              <View style={styles.inputContainer}>
                <Icon name="resize-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="Altura en cm"
                  placeholderTextColor={theme.colors.input.placeholder}
                  editable={!isLoading}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
            </View>

            {userData && userData.bmi && (
              <View style={styles.bmiInfo}>
                <Text style={styles.bmiLabel}>Tu IMC actual:</Text>
                <Text style={styles.bmiValue}>{userData.bmi.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Icon name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              A continuación, evaluaremos tus síntomas y hábitos actuales para ajustar tu programa personalizado.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, (!weight || !height || isLoading) && styles.disabledButton]}
            onPress={handleContinue}
            disabled={isLoading || !weight || !height}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  Continuar con la evaluación
                </Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  unit: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  bmiInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  bmiLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  bmiValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
});