// src/screens/OnboardingWelcomeScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { getData } from '../utils/storage';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Tipos temporales - después los movemos a archivo separado
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
};

type OnboardingWelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingWelcome'>;

const { width, height } = Dimensions.get('window');

// Información sobre los pasos del onboarding
const onboardingSteps = [
  {
    id: 1,
    title: 'Información General',
    description: 'Datos básicos sobre tu peso y altura para personalizar tu experiencia.',
    icon: 'person-outline',
    color: theme.colors.secondary,
  },
  {
    id: 2,
    title: 'Cuestionario GerdQ',
    description: 'Evaluación de síntomas de reflujo gastroesofágico.',
    icon: 'medical-outline',
    color: theme.colors.primary,
  },
  {
    id: 3,
    title: 'Cuestionario RSI',
    description: 'Índice de síntomas de reflujo para evaluar la severidad.',
    icon: 'pulse-outline',
    color: theme.colors.primary,
  },
  {
    id: 4,
    title: 'Factores Clínicos',
    description: 'Información sobre factores que pueden influir en tu reflujo.',
    icon: 'medkit-outline',
    color: theme.colors.secondary,
  },
  {
    id: 5,
    title: 'Pruebas Diagnósticas',
    description: 'Información sobre endoscopias o pH-metrías que te hayan realizado.',
    icon: 'flask-outline',
    color: theme.colors.primary,
  },
  {
    id: 6,
    title: 'Hábitos Diarios',
    description: 'Información sobre tus hábitos de alimentación y estilo de vida.',
    icon: 'nutrition-outline',
    color: theme.colors.secondary,
  }
];

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<OnboardingWelcomeNavigationProp>();

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingWelcomeScreen...");
      const token = await getData('authToken');
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Verificar si el onboarding ya está completo
      try {
        const profileResponse = await api.get('/api/profiles/me/');
        if (profileResponse.data && profileResponse.data.onboarding_complete) {
          console.log("Onboarding ya completado, redirigiendo a Home...");
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }
      } catch (error) {
        console.error("Error al verificar estado de onboarding:", error);
        // Continuar con el onboarding aunque haya un error
      }
    };
  
    checkAuth();
  }, [navigation]);

  // Navegar al primer paso del onboarding
  const handleStart = async () => {
    // Por ahora navegamos a Home (después implementaremos OnboardingGeneral)
    navigation.reset({
      index: 0,
      routes: [{ name: 'OnboardingGeneral' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />
      
      <View style={styles.headerBlue}>
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>¡Bienvenido a</Text>
              <Text style={styles.appName}>Gastro<Text style={styles.appNameAccent}>Assistant</Text>!</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.titleText}>Personaliza tu experiencia</Text>
          
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Para brindarte la mejor experiencia y recomendaciones personalizadas,
              necesitamos conocer más sobre tu salud digestiva. Vamos a realizar
              algunos cuestionarios breves:
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {onboardingSteps.map((item, index) => (
              <View key={item.id} style={styles.stepCard}>
                <View style={[styles.stepIconContainer, { backgroundColor: item.color }]}>
                  <Icon name={item.icon} size={24} color={theme.colors.surface} />
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Beneficios</Text>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Icon name="thumbs-up-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.benefitText}>Recomendaciones personalizadas basadas en tus síntomas</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Icon name="analytics-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.benefitText}>Seguimiento de hábitos para mejorar tu salud digestiva</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Icon name="newspaper-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.benefitText}>Programa personalizado según tu perfil ERGE</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Icon name="notifications-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.benefitText}>Recordatorios y alertas personalizadas</Text>
            </View>
          </View>

          <Text style={styles.noteText}>
            Completar este proceso solo tomará unos 10 minutos aproximadamente. 
            Tus respuestas nos ayudarán a personalizar la app para tus necesidades específicas.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStart}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Empezar Ahora</Text>
            <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBlue: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? 20 : 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
  },
  headerTextContainer: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.surface,
    marginBottom: 2,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  appNameAccent: {
    color: theme.colors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  contentContainer: {
    padding: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  introCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    ...theme.shadows.sm,
  },
  introText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  stepsContainer: {
    marginBottom: 25,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.surface,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  benefitsContainer: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 15,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});