// src/screens/GeneratingProgramScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
  BackHandler,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../utils/api';
import { getData, clearOnboardingProgress } from '../utils/storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../constants/theme';

// Tipos de navegación - actualizar después en archivo separado
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

type GeneratingProgramNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GeneratingProgram'>;

const { width } = Dimensions.get('window');

// Frases para mostrar durante la generación - relacionadas con las secciones
const generatingPhrases = [
  "Iniciando análisis de tu perfil digestivo...",
  "Ajustando tu Perfil de salud...",
  "Creando tu Plan Digestivo personalizado...",
  "Preparando tu Tracker de síntomas...",
  "Generando contenido educativo en Aprende...",
  "Aplicando inteligencia artificial avanzada...",
  "¡Tu app está casi lista!",
];

// Path de secciones de la app con íconos
const appSections = [
  { icon: 'home', label: 'Programa', color: theme.colors.secondary },
  { icon: 'trending-up', label: 'Tracker', color: theme.colors.accent },
  { icon: 'book', label: 'Aprende', color: theme.colors.info.main },
  { icon: 'stats-chart', label: 'Stats', color: theme.colors.success.main },
  { icon: 'person', label: 'Perfil', color: theme.colors.warning.main }
];

export default function GeneratingProgramScreen() {
  const navigation = useNavigation<GeneratingProgramNavigationProp>();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [userProgram, setUserProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // Empezar en -1
  
  // Animaciones
  const progressValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const sectionAnimations = useRef(appSections.map(() => new Animated.Value(0))).current;
  const pathAnimation = useRef(new Animated.Value(0)).current;


  
  // Función para iniciar todas las animaciones
  const startAllAnimations = () => {
    // Animación compleja del logo
    // 1. Pulso principal
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // 2. Rotación continua
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // 3. Pulso secundario rápido
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.05,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // 4. Efecto glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Animación de progreso - 40 segundos
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 40000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    
    // Animación del path de secciones
    Animated.timing(pathAnimation, {
      toValue: 1,
      duration: 35000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    
    // Animación de secciones individuales en orden
    const sectionDelay = 2000; // Retraso inicial
    const sectionInterval = 1500; // Tiempo entre cada sección
    
    appSections.forEach((_, index) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.spring(sectionAnimations[index], {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(sectionAnimations[index], {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
        setCurrentStep(index);
      }, sectionDelay + (index * sectionInterval));
    });
  };
  
  // Deshabilitar el botón de retroceso
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);
  
  // Animación del logo e inicialización
  useEffect(() => {
    startAllAnimations();
  }, []);
  
  // Cambiar la frase mostrada cada cierto tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      // Desvanecer el texto actual
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Cambiar a la siguiente frase
        setCurrentPhraseIndex(prevIndex => 
          prevIndex < generatingPhrases.length - 1 ? prevIndex + 1 : prevIndex
        );
        
        // Hacer aparecer el nuevo texto
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500); // Cambiar frase cada 2.5 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  // Mostrar el botón de recuperación después de 30 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRecovery(true);
    }, 30000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Intentar obtener o generar el programa
  useEffect(() => {
    const generateUserProgram = async () => {
      const token = await getData('authToken');
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Marcar tiempo de inicio para calcular duración mínima
      const processingStartTime = Date.now();
      
      try {
        // Paso 1: Verificar que el onboarding esté completo
        console.log("Verificando estado del onboarding...");
        const profileResponse = await api.get('/api/profiles/me/');
        const profile = profileResponse.data;
        
        if (!profile.onboarding_complete) {
          console.warn("⚠️ El onboarding no está marcado como completo, pero continuamos");
        } else {
          console.log("✅ Onboarding confirmado como completo");
        }
        
        // Paso 2: Verificar si existe un ciclo, si no crearlo
        console.log("Verificando estado del ciclo...");
        const cycleStatusResponse = await api.get('/api/cycles/check-status/');
        let currentCycle = cycleStatusResponse.data.current_cycle;
        
        if (!currentCycle) {
          console.log("No hay ciclo activo, creando el primer ciclo...");
          const newCycleResponse = await api.post('/api/cycles/start-new/');
          currentCycle = newCycleResponse.data.cycle;
          console.log("✅ Primer ciclo creado:", currentCycle);
        } else {
          console.log("✅ Ciclo activo encontrado:", currentCycle);
        }
        
        // Paso 3: Obtener o generar programa
        try {
          const response = await api.get('/api/programs/my-program/');
          
          if (response.status === 200 && response.data) {
            console.log("Programa existente encontrado:", response.data);
            setUserProgram(response.data);
          }
        } catch (programErr: any) {
          if (programErr.response && programErr.response.status === 404) {
            try {
              console.log("Generando nuevo programa basado en datos completos del onboarding...");
              const generateResponse = await api.post('/api/programs/generate/');
              console.log("Programa generado:", generateResponse.data);
              setUserProgram(generateResponse.data);
            } catch (generateErr) {
              console.error("Error al generar programa:", generateErr);
              setError("No se pudo generar tu programa personalizado");
              return;
            }
          } else {
            console.error("Error al obtener programa:", programErr);
            setError("Error al cargar tu programa");
            return;
          }
        }
        
        // Paso 4: Generar recomendaciones
        try {
          await api.post('/api/recommendations/regenerate/');
          console.log("Recomendaciones generadas correctamente");
        } catch (recError) {
          console.warn("Error al generar recomendaciones:", recError);
          // Continuamos aunque falle esto
        }
        
        // Paso 5: Completar configuración del ciclo con toda la información
        try {
          console.log("Completando configuración del ciclo...");
          
          // Obtener puntuaciones de cuestionarios
          const completionsResponse = await api.get('/api/questionnaires/completions/me/');
          const completions = completionsResponse.data;
          
          const gerdqCompletion = completions.find((c: any) => c.questionnaire.type === 'GERDQ');
          const rsiCompletion = completions.find((c: any) => c.questionnaire.type === 'RSI');
          
          // Completar configuración del ciclo
          await api.post('/api/cycles/complete-setup/', {
            gerdq_score: gerdqCompletion?.score || 0,
            rsi_score: rsiCompletion?.score || 0,
            program_id: userProgram?.program?.id
          });
          
          console.log("✅ Configuración del ciclo completada exitosamente");
        } catch (cycleError) {
          console.warn("⚠️ Error al completar configuración del ciclo:", cycleError);
          // No bloquear el flujo - continuar de todos modos
        }
        
        // Limpiar progreso de onboarding y navegar
        try {
          await clearOnboardingProgress();
          console.log("Progreso de onboarding eliminado");
          
          // Esperar tiempo mínimo para mostrar animaciones
          const processingEndTime = Date.now();
          const processingDuration = processingEndTime - processingStartTime;
          const minimumDisplayTime = 15000; // 15 segundos mínimo
          
          if (processingDuration < minimumDisplayTime) {
            const remainingTime = minimumDisplayTime - processingDuration;
            console.log(`⏱️ Esperando ${remainingTime}ms adicionales para completar animación...`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ProgramDetails' }]
            });
          }, 100);
        } catch (clearErr) {
          console.warn("Error al limpiar progreso de onboarding:", clearErr);
        }
        
      } catch (err) {
        console.error("Error general al generar programa:", err);
        setError("Error en el proceso de generación");
        
        if (retryCount < 2) {
          setRetryCount(prevCount => prevCount + 1);
          setTimeout(generateUserProgram, 3000);
        }
      } finally {
        // Esperar al menos 15 segundos en total para una mejor experiencia visual
        setTimeout(() => {
          setIsLoading(false);
        }, 15000);
      }
    };
    
    generateUserProgram();
    
    // Establecer un temporizador de seguridad para navegar después de 45 segundos
    const safetyTimeout = setTimeout(() => {
      console.log("Tiempo de generación excedido, navegando a la siguiente pantalla...");
      navigation.replace('ProgramDetails');
    }, 45000);
    
    return () => clearTimeout(safetyTimeout);
  }, [navigation, retryCount]);
  
  // Cuando termina la carga, navegar a la pantalla correspondiente
  useEffect(() => {
    if (!isLoading) {
      if (error || !userProgram) {
        // Si hay error o no se pudo generar un programa, ir a ProgramDetails
        navigation.replace('ProgramDetails');
      } else {
        // Si todo está bien, ir a ProgramDetails
        navigation.replace('ProgramDetails');
      }
    }
  }, [isLoading, error, userProgram, navigation]);
  
  // Calcular el ancho de la barra de progreso
  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  // Rotación del logo
  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Función para forzar la finalización del onboarding
  const forceCompletion = async () => {
    try {
      const token = await getData('authToken');
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }]
        });
        return;
      }
      
      // Llamar al endpoint para forzar la finalización
      await api.post('/api/profiles/complete-onboarding/');
      
      // Limpiar progreso de onboarding
      await clearOnboardingProgress();
      
      // Navegar a ProgramDetails
      Alert.alert(
        "¡Proceso completado!",
        "Tu programa ha sido configurado. Ahora puedes acceder a la aplicación.",
        [
          {
            text: "Continuar",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ProgramDetails' }]
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error en recuperación:", error);
      Alert.alert(
        "Error",
        "No se pudo completar el proceso. Intentaremos llevarte a la pantalla principal.",
        [
          {
            text: "Aceptar",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ProgramDetails' }]
              });
            }
          }
        ]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <View style={styles.contentContainer}>
        {/* Logo super animado */}
        <Animated.View style={[
          styles.logoContainer,
          {
            transform: [
              { 
                scale: Animated.multiply(logoScale, logoPulse)
              },
              { 
                rotate: logoRotation 
              }
            ],
            opacity: Animated.add(0.8, Animated.multiply(logoGlow, 0.2))
          }
        ]}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Efecto glow */}
          <Animated.View 
            style={[
              styles.logoGlow,
              {
                opacity: logoGlow,
                transform: [{ scale: Animated.add(1, Animated.multiply(logoGlow, 0.3)) }]
              }
            ]} 
          />
        </Animated.View>
        
        <Text style={styles.title}>Generando tu Plan Digestivo</Text>
        
        {/* Path de secciones de la app - OPTIMIZADO */}
        <View style={styles.sectionsContainer}>
          {appSections.map((section, index) => (
            <Animated.View
              key={`section-${index}`}
              style={[
                styles.sectionItem,
                {
                  opacity: sectionAnimations[index],
                  transform: [{
                    scale: sectionAnimations[index].interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [0.3, 1.15, 1],
                    })
                  }]
                }
              ]}
            >
              <View style={[
                styles.sectionIcon,
                { 
                  backgroundColor: currentStep >= index ? section.color : 'rgba(255, 255, 255, 0.1)',
                  borderColor: currentStep >= index ? theme.colors.surface : 'transparent',
                },
                currentStep === index && styles.sectionIconActive
              ]}>
                <Icon 
                  name={section.icon} 
                  size={28} 
                  color={theme.colors.surface} 
                />
              </View>
              <Text style={[
                styles.sectionLabel,
                currentStep >= index && styles.sectionLabelActive
              ]}>
                {section.label}
              </Text>
            </Animated.View>
          ))}
        </View>
        
        {/* Frase animada */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.generatingText}>
            {generatingPhrases[currentPhraseIndex]}
          </Text>
        </Animated.View>
        
        {/* Barra de progreso */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth }
            ]}
          />
        </View>
        
        {/* Indicador de actividad */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.surface} />
          <View style={styles.dotsContainer}>
            <Text style={styles.dots}>•••</Text>
          </View>
        </View>
        
        <Text style={styles.waitText}>
          Estamos aplicando inteligencia artificial para crear el mejor programa para ti
        </Text>
        
        {/* Botón de recuperación */}
        {showRecovery && (
          <Animated.View style={[
            styles.recoveryContainer,
            {
              opacity: fadeAnim
            }
          ]}>
            <Text style={styles.recoveryText}>
              ¿Está tardando demasiado?
            </Text>
            <TouchableOpacity
              style={styles.recoveryButton}
              onPress={forceCompletion}
            >
              <Text style={styles.recoveryButtonText}>
                Completar ahora
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.secondary,
    zIndex: 1,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },

  // ESTILOS OPTIMIZADOS PARA LAS SECCIONES
  sectionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionItem: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  sectionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.md,
  },
  sectionIconActive: {
    borderColor: theme.colors.surface,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionLabelActive: {
    color: theme.colors.surface,
    fontWeight: '700',
  },

  generatingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
  },
  progressBarContainer: {
    width: width - 60,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dotsContainer: {
    marginTop: theme.spacing.sm,
  },
  dots: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.surface,
    letterSpacing: 5,
  },
  waitText: {
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },
  recoveryContainer: {
    position: 'absolute',
    bottom: 240,
    alignItems: 'center',
  },
  recoveryText: {
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
  },
  recoveryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recoveryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  }
});