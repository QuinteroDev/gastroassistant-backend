import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Vibration
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

// Interfaces simplificadas
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

// Mapeo de títulos de hábitos mejorados (sin preguntas)
const HABIT_TITLES: { [key: string]: string } = {
  'MEAL_SIZE': 'Control de porciones',
  'DINNER_TIME': 'Horario de cena temprano',
  'LIE_DOWN': 'Tiempo después de comer',
  'NIGHT_SYMPTOMS': 'Manejo síntomas nocturnos',
  'SMOKING': 'Control del tabaco',
  'ALCOHOL': 'Consumo moderado de alcohol',
  'EXERCISE': 'Actividad física regular',
  'AVOID_TRIGGERS': 'Evitar alimentos gatillo',
  'STRESS': 'Manejo del estrés',
  'HYDRATION_MEALS': 'Hidratación durante comidas',
  'HYDRATION_DAY': 'Hidratación diaria',
  'CHEWING': 'Masticación consciente'
};

// Iconos para tipos de hábitos con colores del tema
const HABIT_ICONS: { [key: string]: JSX.Element } = {
  'MEAL_SIZE': <MaterialCommunityIcons name="food-variant" size={24} color="#ffffff" />,
  'DINNER_TIME': <Icon name="time-outline" size={24} color="#ffffff" />,
  'LIE_DOWN': <FontAwesome5 name="bed" size={22} color="#ffffff" />,
  'NIGHT_SYMPTOMS': <Icon name="moon-outline" size={24} color="#ffffff" />,
  'SMOKING': <MaterialCommunityIcons name="smoking-off" size={24} color="#ffffff" />,
  'ALCOHOL': <Icon name="wine-outline" size={24} color="#ffffff" />,
  'EXERCISE': <Icon name="fitness-outline" size={24} color="#ffffff" />,
  'AVOID_TRIGGERS': <Icon name="nutrition-outline" size={24} color="#ffffff" />,
  'STRESS': <Icon name="fitness" size={24} color="#ffffff" />,
  'HYDRATION_MEALS': <Icon name="water-outline" size={24} color="#ffffff" />,
  'HYDRATION_DAY': <Icon name="water" size={24} color="#ffffff" />,
  'CHEWING': <MaterialCommunityIcons name="food-apple" size={24} color="#ffffff" />
};

// Colores para niveles de completado usando el tema
const COMPLETION_COLORS = {
  null: '#f8f9fa', // Sin seleccionar - gris claro
  0: theme.colors.habits.notAchieved,
  1: theme.colors.habits.partial,
  2: theme.colors.habits.good,
  3: theme.colors.habits.excellent
};

// Fecha actual en formato ISO
const getToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Formato legible para mostrar fecha
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
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Cargar datos al inicio
  useEffect(() => {
    loadHabits();
    checkCompletionStatus();
  }, []);

  // Animar la barra de progreso cuando cambie
  useEffect(() => {
    // Animar el llenado
    Animated.timing(progressFillAnim, {
      toValue: dailyProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Si llega al 100%, hacer bounce y detener shimmer
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
      
      // Detener shimmer
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    } else if (dailyProgress > 0) {
      // Efecto shimmer solo cuando está entre 0 y 100
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

  // Función para verificar si ya se mostró el modal hoy
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

  // Función para cargar hábitos
  const loadHabits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/habits/');
      let habitData: HabitTracker[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        habitData = response.data.slice(0, 5);
        setHabits(habitData);
        
        // Cargar los logs de hábitos para hoy
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
            
            // Calcular progreso
            const completedCount = Object.values(completionMap).filter(level => level !== null && level >= 0).length;
            const progress = habitData.length > 0 ? (completedCount / habitData.length) * 100 : 0;
            setDailyProgress(progress);
            
            // Establecer el nivel de completado del primer hábito
            if (habitData.length > 0 && completionMap[habitData[0].id] !== undefined) {
              setCompletionLevel(completionMap[habitData[0].id]);
            }
          } catch (err) {
            console.error("Error al cargar logs:", err);
          }
        }
        
        // Animación de entrada
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

  // Función para guardar un registro de hábito y avanzar al siguiente
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
        
        await api.post('/api/habits/log/', data);
        
        // Recalcular el progreso
        const completedCount = Object.values(updatedLevels).filter(l => l !== null && l >= 0).length;
        const newProgress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
        setDailyProgress(newProgress);
        
        // NUEVO: Verificar si completamos TODOS los hábitos
        if (completedCount === habits.length && !allCompleted) {
          // Mostrar el modal solo UNA vez
          setAllCompleted(true);
          setShowCompletionModal(true);
        }
        
        // Avanzar al siguiente hábito si no es el último
        if (selectedHabitIndex < habits.length - 1) {
          const nextIndex = selectedHabitIndex + 1;
          setSelectedHabitIndex(nextIndex);
          
          // Establecer el nivel de completado del siguiente hábito
          const nextHabitId = habits[nextIndex].id;
          setCompletionLevel(updatedLevels[nextHabitId] || null);
        }
        
      } catch (err) {
        console.error('Error al guardar el registro:', err);
        Alert.alert('Error', 'No pudimos guardar tu registro. Intenta de nuevo más tarde.');
      }
    };
  

  // Función para guardar las notas finales
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
        
        // IMPORTANTE: No volver a mostrar el modal
        // El estado allCompleted ya está en true, así que no se volverá a mostrar
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
      } catch (err) {
        console.error('Error al guardar las notas:', err);
      } finally {
        setIsSaving(false);
      }
    };

  // Función para omitir las notas
  const skipNotes = async () => {
    try {
      // Guardar registro vacío para marcar que el modal ya se mostró
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

  // Función para cambiar de hábito
  const changeHabit = (index: number) => {
    setSelectedHabitIndex(index);
    const habitId = habits[index].id;
    setCompletionLevel(completionLevels[habitId] || null);
  };

  // Opciones de nivel de cumplimiento
  const completionOptions = [
    { value: 0, label: 'No logrado', emoji: '😔' },
    { value: 1, label: 'Parcialmente', emoji: '🙂' },
    { value: 2, label: 'Bastante bien', emoji: '😊' },
    { value: 3, label: 'Excelente', emoji: '🎉' },
  ];

  // Modal de celebración
  const renderCompletionModal = () => {
    return (
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.completionModalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim
              }
            ]}
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
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.skipButton]}
                onPress={skipNotes}
              >
                <Text style={styles.skipButtonText}>Omitir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveNotesButton]}
                onPress={saveFinalNotes}
                disabled={isSaving || !notes.trim()}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveNotesButtonText}>Guardar nota</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Renderizar indicadores de progreso
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

  // Renderizar el contenido principal
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
    const currentCompletionLevel = completionLevels[selectedHabit.id];

    return (
      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: fadeAnim }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
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
              
              {/* Barra de progreso con gradiente animado */}
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
                          theme.colors.error.main,     // 0-25%: Rojo
                          theme.colors.warning.main,   // 25-50%: Naranja
                          theme.colors.warning.light,  // 50-75%: Amarillo
                          theme.colors.success.light,  // 75-99%: Verde claro
                          theme.colors.success.main    // 100%: Verde brillante
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
                <Text style={styles.habitTitle}>{habitTitle}</Text>
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
                    currentCompletionLevel === option.value && styles.selectedCard,
                    currentCompletionLevel === option.value && {
                      backgroundColor: COMPLETION_COLORS[option.value],
                      borderColor: theme.colors.primary
                    }
                  ]}
                  onPress={() => saveHabitAndProceed(option.value)}
                >
                  <Text style={styles.completionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.completionLabel,
                    currentCompletionLevel === option.value && styles.selectedLabel
                  ]}>
                    {option.label}
                  </Text>
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
      <TabNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
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
  habitTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
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
    backgroundColor: '#f8f9fa',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  completionEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  completionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: theme.colors.primary,
    fontWeight: 'bold',
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
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
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