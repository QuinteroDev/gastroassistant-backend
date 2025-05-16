// screens/GeneratingProgramScreen.tsx
import React, { useEffect, useState } from 'react';
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
  BackHandler
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import api from '../utils/api';
import { getData, clearOnboardingProgress } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

type GeneratingProgramNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GeneratingProgram'>;

// Frases para mostrar durante la generación
const generatingPhrases = [
  "Analizando tu perfil ERGE...",
  "Evaluando tus síntomas...",
  "Considerando tus hábitos alimentarios...",
  "Personalizando recomendaciones...",
  "Ajustando tu programa según tus factores clínicos...",
  "Preparando tu plan personalizado...",
  "Optimizando tus recomendaciones...",
  "Casi listo...",
];

export default function GeneratingProgramScreen() {
  const navigation = useNavigation<GeneratingProgramNavigationProp>();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [userProgram, setUserProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Animaciones
  const progressValue = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(1))[0];
  
  // Deshabilitar el botón de retroceso
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);
  
  // Iniciar animación de progreso
  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 12000, // 12 segundos para el progreso total
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);
  
  // Cambiar la frase mostrada cada cierto tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      // Desvanecer el texto actual
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Cambiar a la siguiente frase
        setCurrentPhraseIndex(prevIndex => 
          prevIndex < generatingPhrases.length - 1 ? prevIndex + 1 : prevIndex
        );
        
        // Hacer aparecer el nuevo texto
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 3000); // Cambiar frase cada 3 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  // Mostrar el botón de recuperación después de un tiempo
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRecovery(true);
    }, 15000); // Mostrar después de 15 segundos
    
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
      
      try {
        // Paso 1: Verificar que el onboarding esté marcado como completo
        console.log("Verificando estado del onboarding...");
        const profileResponse = await api.get('/api/profiles/me/');
        const profile = profileResponse.data;
        
        if (!profile.onboarding_complete) {
          console.log("Intentando marcar onboarding como completo...");
          const updateResponse = await api.patch('/api/profiles/me/', {
            onboarding_complete: true
          });
          console.log("Resultado de actualización:", updateResponse.data);
        }
        
        // Paso 2: Verificar que el usuario tenga un fenotipo asignado
        console.log("Analizando el perfil del usuario...");
        try {
          await api.get('/api/profiles/phenotype/');
        } catch (phenotypeErr) {
          console.warn("Error al verificar fenotipo:", phenotypeErr);
          // Continuamos aunque falle
        }
        
        // Paso 3: Intentar obtener un programa existente
        try {
          const response = await api.get('/api/programs/my-program/');
          
          if (response.status === 200 && response.data) {
            console.log("Programa existente encontrado:", response.data);
            setUserProgram(response.data);
          }
        } catch (programErr) {
          // Si no hay programa o hay algún error, intentar generarlo
          if (programErr.response && programErr.response.status === 404) {
            // Paso 4: Generar un nuevo programa
            try {
              // Este endpoint debería generar un nuevo programa basado en el fenotipo
              const generateResponse = await api.post('/api/programs/generate/');
              console.log("Programa generado:", generateResponse.data);
              setUserProgram(generateResponse.data);
            } catch (generateErr) {
              console.error("Error al generar programa:", generateErr);
              setError("No se pudo generar tu programa personalizado");
            }
          } else {
            console.error("Error al obtener programa:", programErr);
            setError("Error al cargar tu programa");
          }
        }
        
        // Paso 5: Generar recomendaciones
        try {
          await api.post('/api/recommendations/regenerate/');
          console.log("Recomendaciones generadas correctamente");
        } catch (recError) {
          console.warn("Error al generar recomendaciones:", recError);
          // Continuamos aunque falle esto
        }
        
        // Limpiar progreso de onboarding
        try {
          await clearOnboardingProgress();
          console.log("Progreso de onboarding eliminado");
        } catch (clearErr) {
          console.warn("Error al limpiar progreso de onboarding:", clearErr);
        }
      } catch (err) {
        console.error("Error general al generar programa:", err);
        setError("Error en el proceso de generación");
        
        // Intentar de nuevo si no hemos superado el límite de intentos
        if (retryCount < 2) {
          setRetryCount(prevCount => prevCount + 1);
          setTimeout(generateUserProgram, 3000); // Esperar 3 segundos antes de reintentar
        }
      } finally {
        // Esperar al menos 5 segundos en total para una mejor experiencia visual
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);
      }
    };
    
    generateUserProgram();
    
    // Establecer un temporizador de seguridad para navegar después de 20 segundos,
    // independientemente del resultado de la API
    const safetyTimeout = setTimeout(() => {
      console.log("Tiempo de generación excedido, navegando a la siguiente pantalla...");
      navigation.replace('Home');
    }, 20000);
    
    return () => clearTimeout(safetyTimeout);
  }, [navigation, retryCount]);
  
  // Cuando termina la carga, navegar a la pantalla correspondiente
  useEffect(() => {
    if (!isLoading) {
      if (error || !userProgram) {
        // Si hay error o no se pudo generar un programa, ir a Home
        navigation.replace('Home');
      } else {
        // Si todo está bien, ir a los detalles del programa
        navigation.replace('ProgramDetails');
      }
    }
  }, [isLoading, error, userProgram, navigation]);
  
  // Calcular el ancho de la barra de progreso
  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
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
      
      // Navegar a Home
      Alert.alert(
        "¡Proceso completado!",
        "Tu programa ha sido configurado. Ahora puedes acceder a la aplicación.",
        [
          {
            text: "Continuar",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }]
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
                routes: [{ name: 'Home' }]
              });
            }
          }
        ]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0077B6" />
      
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="flask-outline" size={60} color="#ffffff" />
        </View>
        
        <Text style={styles.title}>Generando tu Programa</Text>
        
        <Animated.Text style={[styles.generatingText, { opacity: fadeAnim }]}>
          {generatingPhrases[currentPhraseIndex]}
        </Animated.Text>
        
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth }
            ]}
          />
        </View>
        
        <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        
        <Text style={styles.waitText}>
          Por favor espera mientras personalizamos tu experiencia...
        </Text>
        
        {showRecovery && (
          <View style={styles.recoveryContainer}>
            <Text style={styles.recoveryText}>
              ¿Problemas para completar el proceso?
            </Text>
            <TouchableOpacity
              style={styles.recoveryButton}
              onPress={forceCompletion}
            >
              <Text style={styles.recoveryButtonText}>
                Finalizar manualmente
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0077B6',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  generatingText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
    minHeight: 25,
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  spinner: {
    marginBottom: 20,
  },
  waitText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  recoveryContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  recoveryText: {
    color: '#FFFFFF',
    marginBottom: 10,
    fontSize: 14,
  },
  recoveryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  recoveryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});