// screens/OnboardingWelcomeScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getData } from '../utils/storage'; // Usar nuestra abstracción de almacenamiento
import GastroAvatar from '../components/GastroAvatar';
import CustomButton from '../components/CustomButton';

// Tipo para la navegación
type OnboardingWelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingWelcome'>;

const { width, height } = Dimensions.get('window');

// Información sobre los pasos del onboarding
const onboardingSteps = [
  {
    id: 1,
    title: 'Información General',
    description: 'Datos básicos sobre tu peso y altura para personalizar tu experiencia.',
    icon: 'person-outline',
    color: '#0096C7',
  },
  {
    id: 2,
    title: 'Cuestionario GerdQ',
    description: 'Evaluación de síntomas de reflujo gastroesofágico.',
    icon: 'medical-outline',
    color: '#0077B6',
  },
  {
    id: 3,
    title: 'Cuestionario RSI',
    description: 'Índice de síntomas de reflujo para evaluar la severidad.',
    icon: 'pulse-outline',
    color: '#023E8A',
  },
  {
    id: 4,
    title: 'Factores Clínicos',
    description: 'Información sobre factores que pueden influir en tu reflujo.',
    icon: 'medkit-outline',
    color: '#0096C7',
  },
  {
    id: 5,
    title: 'Pruebas Diagnósticas',
    description: 'Información sobre endoscopias o pH-metrías que te hayan realizado.',
    icon: 'flask-outline',
    color: '#023E8A',
  },
  {
    id: 6,
    title: 'Hábitos Diarios',
    description: 'Información sobre tus hábitos de alimentación y estilo de vida.',
    icon: 'nutrition-outline',
    color: '#0077B6',
  }
];

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<OnboardingWelcomeNavigationProp>();

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingWelcomeScreen...");
      const token = await getData('authToken');
      console.log("Token en OnboardingWelcomeScreen:", token ? "Existe" : "No existe");
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    
    checkAuth();
  }, [navigation]);

  // Navegar al primer paso del onboarding
  const handleStart = () => {
    navigation.navigate('OnboardingGeneral');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={['#0077B6', '#00B4D8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <GastroAvatar size={50} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>¡Bienvenido a</Text>
              <Text style={styles.appName}>Gastro<Text style={styles.appNameAccent}>Assistant</Text>!</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

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
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
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
                <Ionicons name="thumbs-up-outline" size={22} color="#0077B6" />
              </View>
              <Text style={styles.benefitText}>Recomendaciones personalizadas basadas en tus síntomas</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="analytics-outline" size={22} color="#0077B6" />
              </View>
              <Text style={styles.benefitText}>Seguimiento de hábitos para mejorar tu salud digestiva</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="newspaper-outline" size={22} color="#0077B6" />
              </View>
              <Text style={styles.benefitText}>Programa personalizado según tu perfil ERGE</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#0077B6" />
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
        <CustomButton
          title="Empezar Ahora"
          onPress={handleStart}
          icon="arrow-forward"
          iconPosition="right"
          size="large"
          type="primary"
        />
        
        <Text style={styles.privacyText}>
          Tus datos están seguros y protegidos por nuestra{' '}
          <Text style={styles.privacyLink}>Política de Privacidad</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20 : 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appNameAccent: {
    color: '#CAF0F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 15,
    textAlign: 'center',
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  introText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  stepsContainer: {
    marginBottom: 25,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
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
    backgroundColor: '#FFFFFF',
    color: '#0077B6',
    fontSize: 14,
    fontWeight: 'bold',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0077B6',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f73',
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
    backgroundColor: '#CAF0F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E7EE',
    backgroundColor: '#FFFFFF',
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  privacyLink: {
    color: '#0077B6',
    textDecorationLine: 'underline',
  },
});