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
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import api from '../utils/api';
import { getData } from '../utils/storage';
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
  
  // Animaciones
  const progressValue = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(1))[0];
  
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
        // Primero intentar obtener un programa existente
        const response = await api.get('/api/programs/my-program/');
        
        if (response.status === 200 && response.data) {
          console.log("Programa existente encontrado:", response.data);
          setUserProgram(response.data);
        }
      } catch (err) {
        // Si no hay programa o hay algún error, intentar generarlo
        if (err.response && err.response.status === 404) {
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
          console.error("Error al obtener programa:", err);
          setError("Error al cargar tu programa");
        }
      } finally {
        // Esperar al menos 5 segundos en total para una mejor experiencia visual
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);
      }
    };
    
    generateUserProgram();
    
    // Establecer un temporizador de seguridad para navegar después de 15 segundos,
    // independientemente del resultado de la API
    const safetyTimeout = setTimeout(() => {
      console.log("Tiempo de generación excedido, navegando a la siguiente pantalla...");
      navigation.replace('Home');
    }, 15000);
    
    return () => clearTimeout(safetyTimeout);
  }, [navigation]);
  
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
});