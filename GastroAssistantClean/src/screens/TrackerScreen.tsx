import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainHeaderComponent from '../components/MainHeaderComponent';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../utils/api';
import TabNavigationBar from '../components/TabNavigationBar';
import { theme } from '../constants/theme';

// Tipos de navegación
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
  Tracker: undefined;
  Education: undefined;
  Stats: undefined;
  Profile: undefined;
};

type TrackerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tracker'>;

// Interfaces
interface Habit {
  id: number;
  habit_type: string;
  text: string;
  description: string;
}

interface HabitTracker {
  id: number;
  habit: Habit;
  is_active: boolean;
  is_promoted: boolean;
  current_score: number;
  target_score: number;
  streak?: {
    current_streak: number;
    longest_streak: number;
  };
}

interface Medal {
  id: number;
  name: string;
  description: string;
  icon: string;
  required_points: number;
  required_level: string;
  required_cycle_number?: number;
}

interface NewMedal {
  id: number;
  medal: Medal;
  earned_at: string;
  points_when_earned: number;
  level_when_earned: string;
  cycle_number: number;
}

// Mapeo de títulos de hábitos
const HABIT_TITLES: { [key: string]: string } = {
  'MEAL_SIZE': 'Evitar llenarte en exceso',
  'DINNER_TIME': 'Cenar temprano',
  'LIE_DOWN': 'Evitar tumbarse tras comer',
  'EXERCISE': 'Moverte cada día',
  'AVOID_TRIGGERS': 'Evitar alimentos que te sientan mal',
  'STRESS': 'Gestionar el estrés',
  'HYDRATION_MEALS': 'Evitar beber durante las comidas',
  'HYDRATION_DAY': 'Beber suficiente durante el día',
  'CHEWING': 'Masticar bien los alimentos',
  'PROCESSED_FOODS': 'Evitar ultraprocesados',
  'MINDFUL_EATING': 'Comer sin distracciones'
};

// Mapeo de descripciones de hábitos
const HABIT_DESCRIPTIONS: { [key: string]: string } = {
  'MEAL_SIZE': 'Comer porciones moderadas ayuda a prevenir molestias digestivas y sensación de pesadez.',
  'DINNER_TIME': 'Cenar temprano da tiempo a que la digestión avance antes de acostarte, reduciendo el riesgo de reflujo.',
  'LIE_DOWN': 'Permanecer erguido tras las comidas ayuda a evitar que el contenido del estómago suba hacia el esófago.',
  'EXERCISE': 'Caminar o ejercicio físico puede mejorar la digestión y reducir molestias.',
  'AVOID_TRIGGERS': 'Identificar lo que no toleras y evitarlo es clave para tu evolución al inicio.',
  'STRESS': 'El estrés afecta directamente a tu digestión. Incorporar rutinas de relajación es fundamental.',
  'HYDRATION_MEALS': 'Beber grandes cantidades mientras comes puede dificultar la digestión.',
  'HYDRATION_DAY': 'Una buena hidratación fuera de las comidas mejora tu tránsito y tu energía.',
  'CHEWING': 'Masticar despacio y conscientemente facilita la digestión y reduce la sensación de hinchazón.',
  'PROCESSED_FOODS': 'Reducir bollería, snacks y comida rápida mejora la inflamación y el equilibrio digestivo.',
  'MINDFUL_EATING': 'Comer con atención mejora tu conexión con la saciedad y tu digestión.'
};

// Iconos para tipos de hábitos
const HABIT_ICONS: { [key: string]: JSX.Element } = {
  'MEAL_SIZE': <MaterialCommunityIcons name="food-variant" size={24} color="#ffffff" />,
  'DINNER_TIME': <Icon name="time-outline" size={24} color="#ffffff" />,
  'LIE_DOWN': <FontAwesome5 name="bed" size={22} color="#ffffff" />,
  'EXERCISE': <Icon name="fitness-outline" size={24} color="#ffffff" />,
  'AVOID_TRIGGERS': <Icon name="nutrition-outline" size={24} color="#ffffff" />,
  'STRESS': <Icon name="fitness" size={24} color="#ffffff" />,
  'HYDRATION_MEALS': <Icon name="water-outline" size={24} color="#ffffff" />,
  'HYDRATION_DAY': <Icon name="water" size={24} color="#ffffff" />,
  'CHEWING': <MaterialCommunityIcons name="food-apple" size={24} color="#ffffff" />,
  'PROCESSED_FOODS': <MaterialCommunityIcons name="food-off" size={24} color="#ffffff" />,
  'MINDFUL_EATING': <Icon name="eye" size={24} color="#ffffff" />
};

// Funciones auxiliares
const getToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDisplayDate = (date = new Date()) => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

const { width } = Dimensions.get('window');
const today = getToday();
const todayFormatted = formatDisplayDate();

// Componente principal
export default function TrackerScreen() {
  const navigation = useNavigation<TrackerScreenNavigationProp>();
  
  // Estados
  const [habits, setHabits] = useState<HabitTracker[]>([]);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number>(0);
  const [completionLevel, setCompletionLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<number>(0);
  const [completionLevels, setCompletionLevels] = useState<{[key: number]: number | null}>({});
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [allCompleted, setAllCompleted] = useState<boolean>(false);
  const [modalAlreadyShown, setModalAlreadyShown] = useState<boolean>(false);
  
  // Estados para medallas
  const [showMedalModal, setShowMedalModal] = useState<boolean>(false);
  const [newMedal, setNewMedal] = useState<NewMedal | null>(null);
  
  // Estado para el párrafo introductorio colapsable
  const [isIntroductoryExpanded, setIsIntroductoryExpanded] = useState<boolean>(false);
  
  // Estado para el modal de descripción del hábito
  const [showHabitDescriptionModal, setShowHabitDescriptionModal] = useState<boolean>(false);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Animaciones para medallas
  const medalFadeAnim = useRef(new Animated.Value(0)).current;
  const medalScaleAnim = useRef(new Animated.Value(0)).current;
  const medalBounceAnim = useRef(new Animated.Value(0)).current;
  const medalShineAnim = useRef(new Animated.Value(0)).current;

  // useEffect existentes
  useEffect(() => {
    loadHabits();
    checkCompletionStatus();
  }, []);

  useEffect(() => {
    // Animar la barra de progreso cuando cambie
    Animated.timing(progressFillAnim, {
      toValue: dailyProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    if (dailyProgress === 100) {
      // Bounce effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    } else if (dailyProgress > 0) {
      // Efecto shimmer
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [dailyProgress]);

  // Efecto para animar medallas
  useEffect(() => {
    if (showMedalModal) {
      // Resetear animaciones
      medalFadeAnim.setValue(0);
      medalScaleAnim.setValue(0);
      medalBounceAnim.setValue(0);
      medalShineAnim.setValue(0);

      // Secuencia de animación
      Animated.sequence([
        // Fade in
        Animated.timing(medalFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale in con bounce
        Animated.spring(medalScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        // Bounce de celebración
        Animated.sequence([
          Animated.timing(medalBounceAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(medalBounceAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Animación de brillo continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(medalShineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(medalShineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showMedalModal]);

  const checkCompletionStatus = async () => {
    try {
      const response = await api.get('/api/habits/check-completion/');
      if (response.data.modal_shown) {
        setModalAlreadyShown(true);
      }
    } catch (err) {
      console.error('Error al verificar estado de completado:', err);
    }
  };

  const loadHabits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/habits/');
      let habitData: HabitTracker[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        habitData = response.data.slice(0, 5);
        setHabits(habitData);
        
        if (habitData.length > 0) {
          const completionMap: {[key: number]: number | null} = {};
          
          try {
            for (const habit of habitData) {
              try {
                const logsResponse = await api.get(`/api/habits/${habit.habit.id}/history/`, {
                  params: { days: 1 }
                });
                
                if (logsResponse.data && Array.isArray(logsResponse.data)) {
                  const todayLog = logsResponse.data.find((log: any) => log.date === today && log.tracker_id === habit.id);
                  
                  if (todayLog && todayLog.completion_level !== undefined) {
                    completionMap[habit.id] = todayLog.completion_level;
                  } else {
                    completionMap[habit.id] = null;
                  }
                }
              } catch (err) {
                console.error(`Error al cargar logs para hábito ${habit.habit.id}:`, err);
                completionMap[habit.id] = null;
              }
            }
            
            setCompletionLevels(completionMap);
            
            const completedCount = Object.values(completionMap).filter(level => level !== null && level >= 0).length;
            const progress = habitData.length > 0 ? (completedCount / habitData.length) * 100 : 0;
            setDailyProgress(progress);
            
            if (habitData.length > 0 && completionMap[habitData[0].id] !== undefined) {
              setCompletionLevel(completionMap[habitData[0].id]);
            }
          } catch (err) {
            console.error("Error al cargar logs:", err);
          }
        }
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.error('Error al cargar hábitos:', err);
      setError('No pudimos cargar tus hábitos. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar hábito con gamificación
  const saveHabitAndProceed = async (level: number) => {
    if (habits.length === 0) return;
    
    const selectedHabit = habits[selectedHabitIndex];
    
    // Actualizar el estado local inmediatamente
    const updatedLevels = { ...completionLevels };
    updatedLevels[selectedHabit.id] = level;
    setCompletionLevels(updatedLevels);
    
    // Guardar en la base de datos
    try {
      const data = {
        tracker_id: selectedHabit.id,
        habit_id: selectedHabit.habit.id,
        date: today,
        completion_level: level,
        notes: ''
      };
      
      console.log('💾 Guardando hábito:', data);
      await api.post('/api/habits/log/', data);
      console.log('💾 Hábito guardado, llamando a gamificación...');
      
      // Procesar gamificación después de guardar el hábito
      try {
        console.log('🎮 Llamando a gamificación API...');
        const gamificationResponse = await api.post('/api/gamification/process/', {
          date: today
        });
        
        console.log('🎮 Respuesta completa:', JSON.stringify(gamificationResponse.data, null, 2));
        
        // Verificar si se ganó una medalla
        if (gamificationResponse.data.new_medals_count > 0 && gamificationResponse.data.new_medals) {
          const earnedMedal = gamificationResponse.data.new_medals[0]; // Mostrar la primera medalla
          console.log('🏆 ¡MEDALLA DETECTADA!:', earnedMedal);
          setNewMedal(earnedMedal);
          setShowMedalModal(true);
          console.log('🏆 Modal de medalla activado');
        } else {
          console.log('😐 Sin medallas nuevas:', {
            count: gamificationResponse.data.new_medals_count,
            medals: gamificationResponse.data.new_medals
          });
        }
        
      } catch (gamificationError) {
        console.error('❌ Error gamificación:', gamificationError);
        console.error('❌ Detalles del error:', gamificationError.response?.data);
        // No bloquear el flujo si falla la gamificación
      }
      
      // Recalcular el progreso
      const completedCount = Object.values(updatedLevels).filter(l => l !== null && l >= 0).length;
      const newProgress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
      setDailyProgress(newProgress);
      
      // Verificar si completamos TODOS los hábitos
      if (completedCount === habits.length && !allCompleted) {
        setAllCompleted(true);
        setShowCompletionModal(true);
      }
      
      // Avanzar al siguiente hábito
      if (selectedHabitIndex < habits.length - 1) {
        const nextIndex = selectedHabitIndex + 1;
        setSelectedHabitIndex(nextIndex);
        const nextHabitId = habits[nextIndex].id;
        setCompletionLevel(updatedLevels[nextHabitId] || null);
      }
      
    } catch (err) {
      console.error('❌ Error al guardar el registro:', err);
      console.error('❌ Detalles del error:', err.response?.data);
      Alert.alert('Error', 'No pudimos guardar tu registro. Intenta de nuevo más tarde.');
    }
  };

  const saveFinalNotes = async () => {
    if (!notes.trim()) {
      setShowCompletionModal(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await api.post('/api/habits/daily-notes/', {
        date: today,
        notes: notes,
        all_completed: true
      });
      
      setShowCompletionModal(false);
      setSuccessMessage('¡Excelente trabajo! Has completado todos tus hábitos del día.');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error al guardar las notas:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const skipNotes = async () => {
    try {
      await api.post('/api/habits/daily-notes/', {
        date: today,
        notes: '',
        all_completed: true
      });
      
      setShowCompletionModal(false);
      setModalAlreadyShown(true);
    } catch (err) {
      console.error('Error al marcar modal como visto:', err);
      setShowCompletionModal(false);
    }
  };

  const changeHabit = (index: number) => {
    setSelectedHabitIndex(index);
    const habitId = habits[index].id;
    setCompletionLevel(completionLevels[habitId] || null);
  };

  // Opciones de nivel con imágenes
  const completionOptions = [
    { 
      value: 0, 
      label: 'No logrado', 
      image: require('../assets/tracker/no_logrado.png')
    },
    { 
      value: 1, 
      label: 'Parcialmente', 
      image: require('../assets/tracker/parcialmente.png')
    },
    { 
      value: 2, 
      label: 'Bastante bien', 
      image: require('../assets/tracker/bastante_bien.png')
    },
    { 
      value: 3, 
      label: 'Excelente', 
      image: require('../assets/tracker/excelente.png')
    },
  ];

  // MODAL DE MEDALLAS EMBELLECIDO
  const renderMedalModal = () => {
    if (!newMedal) return null;

    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };

    const closeMedalModal = () => {
      setShowMedalModal(false);
      setNewMedal(null);
      // Resetear animaciones
      medalFadeAnim.setValue(0);
      medalScaleAnim.setValue(0);
      medalBounceAnim.setValue(0);
      medalShineAnim.setValue(0);
    };

    // Función para obtener imagen de medalla
    const getMedalImage = (medalName: string) => {
      const medalImages: { [key: string]: any } = {
        // Medallas por ciclo con los nombres actualizados
        'Maestro de Hábitos': require('../assets/images/medals/mes1.png'),
        'Guardián Nutricional': require('../assets/images/medals/mes2.png'),
        'Campeón del Movimiento': require('../assets/images/medals/mes3.png'),
        'Domador del Estrés': require('../assets/images/medals/mes4.png'),
        'Campeón del Descanso': require('../assets/images/medals/mes5.png'),
        'Maestro Digestivo Supremo': require('../assets/images/medals/mes6.png'),
      };
      
      return medalImages[medalName] || null;
    };

    const medalImage = getMedalImage(newMedal.medal.name);

    return (
      <Modal
        visible={showMedalModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeMedalModal}
      >
        <TouchableWithoutFeedback onPress={closeMedalModal}>
          <View style={styles.medalModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.medalModalContainer,
                  {
                    opacity: medalFadeAnim,
                    transform: [{ scale: medalScaleAnim }]
                  }
                ]}
              >
                {/* Elementos decorativos de fondo */}
                <View style={styles.medalBackgroundDecorations}>
                  {/* Círculos decorativos */}
                  <Animated.View 
                    style={[
                      styles.decorativeCircle1,
                      {
                        opacity: medalShineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.1, 0.3]
                        }),
                        transform: [
                          {
                            scale: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2]
                            })
                          }
                        ]
                      }
                    ]}
                  />
                  <Animated.View 
                    style={[
                      styles.decorativeCircle2,
                      {
                        opacity: medalShineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.1]
                        }),
                        transform: [
                          {
                            scale: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1.2, 0.8]
                            })
                          }
                        ]
                      }
                    ]}
                  />
                  
                  {/* Estrellas decorativas */}
                  <Animated.View 
                    style={[
                      styles.decorativeStar1,
                      {
                        opacity: medalBounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1]
                        }),
                        transform: [
                          {
                            rotate: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Text style={styles.decorativeEmoji}>⭐</Text>
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.decorativeStar2,
                      {
                        opacity: medalBounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1]
                        }),
                        transform: [
                          {
                            rotate: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['360deg', '0deg']
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Text style={styles.decorativeEmoji}>✨</Text>
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.decorativeStar3,
                      {
                        opacity: medalBounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1]
                        }),
                        transform: [
                          {
                            scale: medalBounceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.5, 1]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Text style={styles.decorativeEmoji}>🎉</Text>
                  </Animated.View>
                </View>

                {/* Fondo con gradiente sutil */}
                <Animated.View 
                  style={[
                    styles.medalShineBackground,
                    {
                      opacity: medalShineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.05, 0.15]
                      })
                    }
                  ]}
                />
                
                {/* Contenido del modal */}
                <View style={styles.medalContent}>
                  {/* Contenedor de la medalla con efectos */}
                  <Animated.View
                    style={[
                      styles.medalMainContainer,
                      {
                        transform: [
                          {
                            scale: medalBounceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.1]
                            })
                          },
                          {
                            rotate: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '5deg']
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    {/* Círculo de fondo dorado */}
                    <View style={styles.medalBackgroundCircle}>
                      <Animated.View 
                        style={[
                          styles.medalGlowEffect,
                          {
                            opacity: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 0.8]
                            })
                          }
                        ]}
                      />
                    </View>
                    
                    {/* Imagen o Icono de la medalla */}
                    <View style={styles.medalImageContainer}>
                      {medalImage ? (
                        <Animated.View
                          style={{
                            transform: [
                              {
                                scale: medalBounceAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.05]
                                })
                              }
                            ]
                          }}
                        >
                          <Image 
                            source={medalImage}
                            style={styles.medalImage}
                            resizeMode="contain"
                          />
                        </Animated.View>
                      ) : (
                        <Animated.View
                          style={{
                            transform: [
                              {
                                scale: medalBounceAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.05]
                                })
                              }
                            ]
                          }}
                        >
                          <Icon name="trophy" size={70} color={theme.colors.accent} />
                        </Animated.View>
                      )}
                      
                      {/* Efecto de brillo rotativo */}
                      <Animated.View 
                        style={[
                          styles.medalShineOverlay,
                          {
                            opacity: medalShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 0.6]
                            }),
                            transform: [
                              {
                                rotate: medalShineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '180deg']
                                })
                              }
                            ]
                          }
                        ]}
                      />
                    </View>
                  </Animated.View>
                  
                  {/* Título de celebración mejorado */}
                  <Animated.View
                    style={{
                      opacity: medalFadeAnim,
                      transform: [
                        {
                          translateY: medalFadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          })
                        }
                      ]
                    }}
                  >
                    <Text style={styles.medalCelebrationTitle}>¡Felicitaciones!</Text>
                    <Text style={styles.medalSubtitle}>Has desbloqueado una nueva medalla</Text>
                  </Animated.View>
                  
                  {/* Nombre de la medalla con estilo */}
                  <Animated.View 
                    style={[
                      styles.medalNameContainer,
                      {
                        opacity: medalFadeAnim,
                        transform: [
                          {
                            translateY: medalFadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Text style={styles.medalName}>{newMedal.medal.name}</Text>
                  </Animated.View>
                  
                  {/* Descripción con mejor formato */}
                  <Animated.View
                    style={{
                      opacity: medalFadeAnim,
                      transform: [
                        {
                          translateY: medalFadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [40, 0]
                          })
                        }
                      ]
                    }}
                  >
                    <Text style={styles.medalDescription}>
                      {newMedal.medal.description}
                    </Text>
                  </Animated.View>
                  
                  {/* Info adicional embellecida */}
                  <Animated.View 
                    style={[
                      styles.medalInfoContainer,
                      {
                        opacity: medalFadeAnim,
                        transform: [
                          {
                            translateY: medalFadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <View style={styles.medalInfoRow}>
                      <View style={styles.medalInfoIcon}>
                        <Icon name="star" size={16} color={theme.colors.accent} />
                      </View>
                      <Text style={styles.medalInfoText}>
                        Nivel: {newMedal.level_when_earned}
                      </Text>
                    </View>
                  </Animated.View>
                  
                  {/* Botón de cerrar mejorado */}
                  <Animated.View
                    style={{
                      opacity: medalFadeAnim,
                      transform: [
                        {
                          translateY: medalFadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [60, 0]
                          })
                        }
                      ]
                    }}
                  >
                    <TouchableOpacity
                      style={styles.medalCloseButton}
                      onPress={closeMedalModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.medalCloseButtonText}>¡Increíble!</Text>
                      <Icon name="chevron-forward" size={16} color={theme.colors.white} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Modal de descripción del hábito
  const renderHabitDescriptionModal = () => {
    const selectedHabit = habits[selectedHabitIndex];
    const habitTitle = HABIT_TITLES[selectedHabit?.habit.habit_type] || selectedHabit?.habit.text;
    const habitDescription = HABIT_DESCRIPTIONS[selectedHabit?.habit.habit_type] || '';

    return (
      <Modal
        visible={showHabitDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHabitDescriptionModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowHabitDescriptionModal(false)}>
          <View style={styles.habitModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.habitModalContainer}>
                <View style={styles.habitModalHeader}>
                  <View style={styles.habitModalIconContainer}>
                    <Icon name="information-circle" size={32} color={theme.colors.primary} />
                  </View>
                  <TouchableOpacity
                    style={styles.habitModalCloseButton}
                    onPress={() => setShowHabitDescriptionModal(false)}
                  >
                    <Icon name="close" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.habitModalTitle}>¿Por qué es importante?</Text>
                
                <View style={styles.habitModalContent}>
                  <Text style={styles.habitModalHabitTitle}>{habitTitle}</Text>
                  <Text style={styles.habitModalDescription}>{habitDescription}</Text>
                </View>

                <TouchableOpacity
                  style={styles.habitModalButton}
                  onPress={() => setShowHabitDescriptionModal(false)}
                >
                  <Text style={styles.habitModalButtonText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  const renderCompletionModal = () => {
    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };

    return (
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          dismissKeyboard();
          setShowCompletionModal(false);
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <Animated.View 
                  style={[
                    styles.completionModalContainer,
                    {
                      transform: [{ scale: scaleAnim }],
                      opacity: fadeAnim
                    }
                  ]}
                >
                  <ScrollView
                    contentContainerStyle={styles.modalScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.celebrationHeader}>
                      <Icon name="trophy" size={60} color={theme.colors.accent} />
                      <Text style={styles.celebrationTitle}>¡Felicitaciones! 🎉</Text>
                      <Text style={styles.celebrationSubtitle}>
                        Has completado todos tus hábitos del día
                      </Text>
                    </View>
                    
                    <View style={styles.notesSection}>
                      <Text style={styles.notesLabel}>
                        ¿Cómo te sientes hoy? Deja una nota (opcional):
                      </Text>
                      <TextInput
                        style={styles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Comparte tu experiencia del día..."
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={theme.colors.text.secondary}
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={dismissKeyboard}
                      />
                    </View>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.skipButton]}
                        onPress={() => {
                          dismissKeyboard();
                          setTimeout(() => skipNotes(), 100);
                        }}
                      >
                        <Text style={styles.skipButtonText}>Omitir</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.modalButton, 
                          styles.saveNotesButton,
                          (!notes.trim() || isSaving) && styles.modalButtonDisabled
                        ]}
                        onPress={() => {
                          dismissKeyboard();
                          setTimeout(() => saveFinalNotes(), 100);
                        }}
                        disabled={isSaving || !notes.trim()}
                      >
                        {isSaving ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.saveNotesButtonText}>Guardar nota</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Función para renderizar el párrafo introductorio colapsable
  const renderIntroductoryParagraph = () => {
    return (
      <View style={styles.introductorySection}>
        <TouchableOpacity
          style={styles.introductoryCard}
          onPress={() => setIsIntroductoryExpanded(!isIntroductoryExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.introductoryHeader}>
            <View style={styles.introductoryIconContainer}>
              <Icon name="bulb" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.introductoryTitle}>Tu Plan de Hábitos</Text>
            <Icon 
              name={isIntroductoryExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.colors.primary} 
            />
          </View>
          
          {isIntroductoryExpanded && (
            <View style={styles.introductoryContent}>
              <Text style={styles.introductoryText}>
                Hemos seleccionado los 5 hábitos más relevantes según tu caso. Trabajarlos cada día puede ayudarte a mejorar tus síntomas y recuperar tu salud digestiva.
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Funciones de renderizado
  const renderProgressIndicators = () => {
    return (
      <View style={styles.progressIndicatorsContainer}>
        {habits.map((habit, index) => {
          const isCompleted = completionLevels[habit.id] !== null && completionLevels[habit.id] !== undefined;
          const isActive = index === selectedHabitIndex;
          
          return (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.progressDot,
                isCompleted && styles.progressDotCompleted,
                isActive && styles.progressDotActive
              ]}
              onPress={() => changeHabit(index)}
            >
              {isCompleted && (
                <Icon name="checkmark" size={12} color="#ffffff" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tus hábitos...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={50} color={theme.colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHabits}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (habits.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="clipboard-outline" size={50} color={theme.colors.primary} />
          <Text style={styles.emptyText}>No tienes hábitos para seguir</Text>
          <Text style={styles.subText}>Completa el cuestionario de hábitos para comenzar</Text>
        </View>
      );
    }

    const selectedHabit = habits[selectedHabitIndex];
    const isPromoted = selectedHabit?.is_promoted || false;
    const habitTitle = HABIT_TITLES[selectedHabit?.habit.habit_type] || selectedHabit?.habit.text;
    const habitDescription = HABIT_DESCRIPTIONS[selectedHabit?.habit.habit_type] || '';
    const currentCompletionLevel = completionLevels[selectedHabit.id];

    return (
      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: fadeAnim }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 🆕 PÁRRAFO INTRODUCTORIO - ARRIBA DEL PROGRESO */}
          {renderIntroductoryParagraph()}

          {/* Header con fecha y progreso */}
          <View style={styles.headerCard}>
            <View style={styles.dateRow}>
              <Icon name="calendar" size={22} color={theme.colors.primary} />
              <Text style={styles.dateText}>{todayFormatted}</Text>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progreso del día</Text>
                <Text style={styles.progressPercentage}>{Math.round(dailyProgress)}%</Text>
              </View>
              
              <Animated.View style={[styles.progressBar, {
                transform: [{ scale: dailyProgress === 100 ? scaleAnim : 1 }]
              }]}>
                <Animated.View 
                  style={[
                    styles.progressFillGradient,
                    {
                      width: progressFillAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: progressFillAnim.interpolate({
                        inputRange: [0, 25, 50, 75, 100],
                        outputRange: [
                          theme.colors.error.main,
                          theme.colors.warning.main,
                          theme.colors.warning.light,
                          theme.colors.success.light,
                          theme.colors.success.main
                        ],
                      }),
                    }
                  ]}
                >
                  {dailyProgress > 0 && dailyProgress < 100 && (
                    <Animated.View 
                      style={[
                        styles.shimmer,
                        {
                          opacity: shimmerAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 0.6, 0],
                          }),
                          transform: [
                            {
                              translateX: shimmerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-100, 200],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                  {dailyProgress === 100 && (
                    <View style={styles.completeIndicator}>
                      <Icon name="checkmark" size={8} color="#ffffff" />
                    </View>
                  )}
                </Animated.View>
              </Animated.View>
            </View>
          </View>

          {/* Indicadores de progreso */}
          {renderProgressIndicators()}

          {/* Tarjeta del hábito actual */}
          <View style={[
            styles.habitCard,
            isPromoted && styles.promotedHabitCard
          ]}>
            <View style={styles.habitHeader}>
              <View style={[
                styles.habitIconContainer,
                { backgroundColor: isPromoted ? theme.colors.accent : theme.colors.primary }
              ]}>
                {HABIT_ICONS[selectedHabit?.habit.habit_type] || 
                 <Icon name="checkmark-circle-outline" size={28} color="#ffffff" />}
              </View>
              
              <View style={styles.habitInfo}>
                <View style={styles.habitTitleContainer}>
                  <Text style={styles.habitTitle}>{habitTitle}</Text>
                  {habitDescription && (
                    <TouchableOpacity
                      style={styles.habitInfoIcon}
                      onPress={() => setShowHabitDescriptionModal(true)}
                    >
                      <Icon name="information-circle-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {isPromoted && (
                  <View style={styles.priorityBadge}>
                    <Icon name="star" size={12} color={theme.colors.accent} />
                    <Text style={styles.priorityText}>Hábito prioritario</Text>
                  </View>
                )}
                {selectedHabit?.streak && selectedHabit.streak.current_streak > 0 && (
                  <View style={styles.streakInfo}>
                    <Icon name="flame" size={14} color={theme.colors.accent} />
                    <Text style={styles.streakText}>
                      {selectedHabit.streak.current_streak} días seguidos
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.questionText}>¿Cómo te fue hoy con este hábito?</Text>

            {/* Opciones de completado */}
            <View style={styles.completionGrid}>
              {completionOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.completionCard,
                    currentCompletionLevel === option.value && styles.selectedCard
                  ]}
                  onPress={() => saveHabitAndProceed(option.value)}
                >
                  <Image 
                    source={option.image}
                    style={styles.completionImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Navegación */}
            <View style={styles.navigationRow}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  selectedHabitIndex === 0 && styles.navButtonDisabled
                ]}
                onPress={() => changeHabit(selectedHabitIndex - 1)}
                disabled={selectedHabitIndex === 0}
              >
                <Icon 
                  name="chevron-back" 
                  size={24} 
                  color={selectedHabitIndex === 0 ? theme.colors.text.disabled : theme.colors.primary} 
                />
                <Text style={[
                  styles.navButtonText,
                  selectedHabitIndex === 0 && styles.navButtonTextDisabled
                ]}>
                  Anterior
                </Text>
              </TouchableOpacity>

              <Text style={styles.habitCounter}>
                {selectedHabitIndex + 1} de {habits.length}
              </Text>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  selectedHabitIndex === habits.length - 1 && styles.navButtonDisabled
                ]}
                onPress={() => changeHabit(selectedHabitIndex + 1)}
                disabled={selectedHabitIndex === habits.length - 1}
              >
                <Text style={[
                  styles.navButtonText,
                  selectedHabitIndex === habits.length - 1 && styles.navButtonTextDisabled
                ]}>
                  Siguiente
                </Text>
                <Icon 
                  name="chevron-forward" 
                  size={24} 
                  color={selectedHabitIndex === habits.length - 1 ? theme.colors.text.disabled : theme.colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mensaje de éxito */}
          {successMessage && (
            <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
              <Icon name="checkmark-circle" size={24} color={theme.colors.success.main} />
              <Text style={styles.successText}>{successMessage}</Text>
            </Animated.View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <MainHeaderComponent />
      {renderContent()}
      {renderCompletionModal()}
      {renderMedalModal()}
      {renderHabitDescriptionModal()}
      <TabNavigationBar />
    </View>
  );
}

// ESTILOS COMPLETOS
const styles = StyleSheet.create({
  // Estilos base
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  contentContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
  },
  errorText: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Header con fecha y progreso
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
    textTransform: 'capitalize',
  },
  progressSection: {
    marginTop: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressPercentage: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFillGradient: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  shimmer: {
    position: 'absolute',
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  completeIndicator: {
    position: 'absolute',
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 🆕 Estilos para el párrafo introductorio colapsable
  introductorySection: {
    marginBottom: theme.spacing.md,
  },
  introductoryCard: {
    backgroundColor: '#F0F8FF', // Fondo azul muy suave
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  introductoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  introductoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  introductoryTitle: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  introductoryContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  introductoryText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  
  // Indicadores de progreso
  progressIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success.main,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressDotActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  
  // Tarjeta del hábito
  habitCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  promotedHabitCard: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  habitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.md,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  habitTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  habitInfoIcon: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: `${theme.colors.primary}10`,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  priorityText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    fontWeight: '600',
    marginLeft: 4,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    marginLeft: 4,
  },
  questionText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  // Grid de opciones
  completionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  completionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    ...theme.shadows.sm,
    minHeight: 160,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
    ...theme.shadows.md,
  },
  completionImage: {
    width: 130,
    height: 130,
  },
  
  // Navegación
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  habitCounter: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  // Modal de descripción del hábito
  habitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  habitModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '90%',
    maxWidth: 400,
    ...theme.shadows.xl,
  },
  habitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  habitModalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitModalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: theme.spacing.sm,
  },
  habitModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    textAlign: 'center',
  },
  habitModalContent: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  habitModalHabitTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  habitModalDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
  habitModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  habitModalButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },

  // Descripción del hábito (removido - ya no se usa)
  
  // Modal de celebración
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  completionModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  celebrationTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  celebrationSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: theme.spacing.xl,
  },
  notesLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
  },
  skipButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  saveNotesButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  saveNotesButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  
  // Modal de medallas
  medalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  medalModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    width: '95%',
    maxWidth: 400,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  medalBackgroundDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.accent,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
  },
  decorativeStar1: {
    position: 'absolute',
    top: 60,
    right: 30,
  },
  decorativeStar2: {
    position: 'absolute',
    top: 120,
    left: 40,
  },
  decorativeStar3: {
    position: 'absolute',
    bottom: 100,
    right: 50,
  },
  decorativeEmoji: {
    fontSize: 24,
  },
  medalShineBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  medalContent: {
    padding: theme.spacing.xxl,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  medalMainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  medalBackgroundCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${theme.colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalGlowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 70,
    backgroundColor: theme.colors.accent,
  },
  medalImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    ...theme.shadows.lg,
  },
  medalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  medalShineOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  medalCelebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  medalSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  medalNameContainer: {
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  medalName: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  medalDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  
  // Info mejorada
  medalInfoContainer: {
    backgroundColor: `${theme.colors.background}80`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: `${theme.colors.border.light}50`,
  },
  medalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  medalInfoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${theme.colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  medalInfoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  
  // Botón mejorado
  medalCloseButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    ...theme.shadows.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  medalCloseButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: 'bold',
  },
  
  // Mensaje de éxito
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.bg,
    borderColor: theme.colors.success.main,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  successText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.success.dark,
    fontSize: theme.fontSize.base,
    flex: 1,
  },
  
  bottomSpacer: {
    height: 20,
  }
});