// screens/TrackerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  Dimensions,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import TabNavigationBar from '../components/TabNavigationBar';

type TrackerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tracker'>;

// Interfaz para un hábito a seguir
interface HabitTracker {
  id: number;
  habit: {
    id: number;
    habit_type: string;
    text: string;
    description: string;
  };
  is_active: boolean;
  is_promoted: boolean;
  current_score: number;
  target_score: number;
  streak?: {
    current_streak: number;
    longest_streak: number;
    last_log_date: string | null;
  };
}

// Interfaz para un registro de hábito
interface HabitLog {
  id?: number;
  tracker_id: number;
  habit_id?: number;
  habit_type?: string;
  date: string;
  completion_level: number;
  notes: string;
  logged_at?: string;
}

// Colores para cada nivel de completado
const COMPLETION_COLORS = {
  0: '#F0F0F0', // No completado
  1: '#FFF3CD', // Parcialmente completado
  2: '#D1ECF1', // Mayormente completado
  3: '#D4EDDA'  // Completamente logrado
};

// Emojis y texto para cada nivel de completado
const COMPLETION_LABELS = {
  0: { emoji: '😔', text: 'No logrado' },
  1: { emoji: '🙂', text: 'Parcialmente' },
  2: { emoji: '😊', text: 'Bastante bien' },
  3: { emoji: '🎉', text: 'Excelente' }
};

// Iconos para tipos de hábitos comunes
const HABIT_ICONS = {
  'MEAL_SIZE': <MaterialCommunityIcons name="food-variant" size={24} color="#0077B6" />,
  'DINNER_TIME': <Ionicons name="time-outline" size={24} color="#0077B6" />,
  'LIE_DOWN': <FontAwesome5 name="bed" size={22} color="#0077B6" />,
  'NIGHT_SYMPTOMS': <Ionicons name="moon-outline" size={24} color="#0077B6" />,
  'SMOKING': <MaterialCommunityIcons name="smoking-off" size={24} color="#0077B6" />,
  'ALCOHOL': <Ionicons name="wine-outline" size={24} color="#0077B6" />,
  'EXERCISE': <Ionicons name="fitness-outline" size={24} color="#0077B6" />,
  'AVOID_TRIGGERS': <Ionicons name="nutrition-outline" size={24} color="#0077B6" />,
  'STRESS': <Ionicons name="fitness" size={24} color="#0077B6" />,
  'HYDRATION_MEALS': <Ionicons name="water-outline" size={24} color="#0077B6" />,
  'HYDRATION_DAY': <Ionicons name="water" size={24} color="#0077B6" />,
  'CHEWING': <MaterialCommunityIcons name="food-apple" size={24} color="#0077B6" />
};

// Función para formatear fecha en formato ISO (YYYY-MM-DD)
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Obtener la fecha actual en formato ISO
const today = formatDate(new Date());

const { width } = Dimensions.get('window');

export default function TrackerScreen() {
  const navigation = useNavigation<TrackerScreenNavigationProp>();
  const [habits, setHabits] = useState<HabitTracker[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedHabit, setSelectedHabit] = useState<HabitTracker | null>(null);
  const [currentHabitIndex, setCurrentHabitIndex] = useState<number>(0);
  const [completionLevel, setCompletionLevel] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [logs, setLogs] = useState<{ [key: string]: { [key: number]: HabitLog } }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  
  // Referencias para animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Cargar datos de hábitos
  useEffect(() => {
    fetchHabits();
  }, []);
  
  // Aplicar animación de escala cuando cambia el hábito seleccionado
  useEffect(() => {
    if (selectedHabit) {
      // Actualizar el índice actual basado en el hábito seleccionado
      const index = habits.findIndex(h => h.id === selectedHabit.id);
      if (index !== -1) {
        setCurrentHabitIndex(index);
      }
      
      // Animación de escala
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
      
      // Buscar un registro previo para este hábito y fecha
      const habitLogs = logs[selectedDate] || {};
      const existingLog = habitLogs[selectedHabit.id];
      
      if (existingLog) {
        setCompletionLevel(existingLog.completion_level);
        setNotes(existingLog.notes || '');
      } else {
        setCompletionLevel(0);
        setNotes('');
      }
    }
  }, [selectedHabit]);
  
  // Función para obtener los hábitos del usuario
  const fetchHabits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/habits/');
      
      if (response.data && Array.isArray(response.data)) {
        setHabits(response.data);
        
        // Seleccionar el primer hábito por defecto
        if (response.data.length > 0) {
          setSelectedHabit(response.data[0]);
        }
        
        // Preparar el mapa para los logs
        const logsMap = {};
        
        // Obtener los logs para cada hábito individualmente
        for (const habit of response.data) {
          try {
            // Usar la ruta correcta con el ID del hábito
            const logsResponse = await api.get(`/api/habits/${habit.habit.id}/history/`, {
              params: { days: 30 } // Según tu backend, el parámetro es 'days'
            });
            
            if (logsResponse.data && Array.isArray(logsResponse.data)) {
              logsResponse.data.forEach(log => {
                if (!logsMap[log.date]) {
                  logsMap[log.date] = {};
                }
                
                logsMap[log.date][log.tracker_id] = log;
              });
            }
          } catch (err) {
            console.error(`Error al cargar logs para hábito ${habit.habit.id}:`, err);
            // Continuamos con el siguiente hábito incluso si hubo un error
          }
        }
        
        setLogs(logsMap);
      }
    } catch (err) {
      console.error("Error al cargar hábitos:", err);
      setError("No pudimos cargar tus hábitos. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para guardar un registro de hábito
  const saveHabitLog = async () => {
    if (!selectedHabit) return;
    
    setIsSaving(true);
    
    try {
      // Corregir el formato: enviamos tanto tracker_id como habit_id
      const logData = {
        tracker_id: selectedHabit.id,
        habit_id: selectedHabit.habit.id, // Añadimos el habit_id desde la estructura anidada
        date: selectedDate,
        completion_level: completionLevel,
        notes: notes
      };
      
      console.log("Enviando datos de registro:", logData);
      
      const response = await api.post('/api/habits/log/', logData);
      
      if (response.data) {
        console.log("Respuesta del servidor:", response.data);
        
        // Actualizar el estado local de logs
        const updatedLogs = { ...logs };
        
        if (!updatedLogs[selectedDate]) {
          updatedLogs[selectedDate] = {};
        }
        
        updatedLogs[selectedDate][selectedHabit.id] = response.data;
        
        setLogs(updatedLogs);
        
        // Actualizar los hábitos si hay cambio en la racha
        if (completionLevel >= 2) {
          const currentStreak = selectedHabit.streak?.current_streak || 0;
          
          if (response.data.streak && response.data.streak.current_streak > currentStreak) {
            // Actualizar la racha en el estado local
            const updatedHabits = habits.map(habit => {
              if (habit.id === selectedHabit.id) {
                return {
                  ...habit,
                  streak: response.data.streak
                };
              }
              return habit;
            });
            
            setHabits(updatedHabits);
          }
        }
        
        // Mostrar mensaje de éxito
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error al guardar registro de hábito:", err);
      
      // Mostrar más información sobre el error para depuración
      if (err.response) {
        console.error("Detalle del error:", err.response.data);
      }
      
      Alert.alert(
        "Error al guardar", 
        "No pudimos guardar tu registro. Por favor, intenta de nuevo más tarde."
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  // Función para calcular el progreso general del día
  const calculateDailyProgress = () => {
    if (!logs[selectedDate]) return 0;
    
    const dayLogs = logs[selectedDate];
    const completedHabits = Object.values(dayLogs).filter(log => log.completion_level > 0).length;
    
    return habits.length > 0 ? (completedHabits / habits.length) : 0;
  };
  
  // Función para verificar si un día tiene registros
  const getDayStatus = (date: string) => {
    if (!logs[date]) return 'incomplete';
    
    const dayLogs = logs[date];
    const loggedHabits = Object.keys(dayLogs).length;
    
    if (loggedHabits === 0) return 'incomplete';
    if (loggedHabits < habits.length) return 'partial';
    return 'complete';
  };
  
  // Función para navegar al hábito anterior
  const goToPreviousHabit = () => {
    if (currentHabitIndex > 0) {
      const newIndex = currentHabitIndex - 1;
      setCurrentHabitIndex(newIndex);
      setSelectedHabit(habits[newIndex]);
    }
  };
  
  // Función para navegar al hábito siguiente
  const goToNextHabit = () => {
    if (currentHabitIndex < habits.length - 1) {
      const newIndex = currentHabitIndex + 1;
      setCurrentHabitIndex(newIndex);
      setSelectedHabit(habits[newIndex]);
    }
  };
  
  // Renderizar "calendario" simplificado
  const renderSimpleCalendar = () => {
    // Generar últimos 7 días en orden cronológico (más antiguo primero)
    const days = [];
    for (let i = 6; i >= 0; i--) {  // Invertimos el orden del loop
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = formatDate(date);
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3);
      const dayNumber = date.getDate();
      const isToday = i === 0;
      const status = getDayStatus(formattedDate);
      
      days.push({ date: formattedDate, dayName, dayNumber, status, isToday });
    }
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarContainer}
      >
        {days.map((day, index) => (
          <TouchableOpacity
            key={day.date}
            style={[
              styles.calendarDay,
              selectedDate === day.date && styles.selectedCalendarDay,
              day.isToday && styles.todayCalendarDay // Destacar el día actual
            ]}
            onPress={() => {
              setSelectedDate(day.date);
              
              // Si hay un hábito seleccionado, actualizar el nivel de completado
              if (selectedHabit) {
                const log = logs[day.date]?.[selectedHabit.id];
                setCompletionLevel(log ? log.completion_level : 0);
                setNotes(log ? log.notes || '' : '');
              }
            }}
          >
            <Text style={[
              styles.calendarDayName,
              selectedDate === day.date && styles.selectedCalendarDayText,
              day.isToday && styles.todayCalendarDayText
            ]}>
              {day.dayName}
            </Text>
            <Text style={[
              styles.calendarDayNumber,
              selectedDate === day.date && styles.selectedCalendarDayText,
              day.isToday && styles.todayCalendarDayText
            ]}>
              {day.dayNumber}
            </Text>
            <View style={[
              styles.calendarDayIndicator,
              day.status === 'complete' && styles.calendarDayComplete,
              day.status === 'partial' && styles.calendarDayPartial,
              day.isToday && styles.todayCalendarDayIndicator
            ]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Renderizar progreso del día
  const renderDailyProgress = () => {
    const progressPercentage = calculateDailyProgress() * 100;
    
    return (
      <View style={styles.progressSection}>
        <View style={styles.progressContainer}>
          <View style={styles.progressCircleOuter}>
            <View style={[
              styles.progressCircleInner,
              { width: `${progressPercentage}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% completado hoy
          </Text>
        </View>
        
        <View style={styles.dateDisplay}>
          <Text style={styles.selectedDateText}>
            {new Date(selectedDate).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </View>
    );
  };
  
  // Renderizar carrusel de hábitos
  const renderHabitsCarousel = () => {
    if (!habits.length || !selectedHabit) return null;
    
    return (
      <View style={styles.habitsListContainer}>
        <Text style={styles.sectionTitle}>Mis Hábitos</Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona un hábito para registrar tu avance de hoy
        </Text>
        
        <View style={styles.carouselContainer}>
          {/* Botón previo */}
          <TouchableOpacity 
            style={[
              styles.carouselArrow,
              currentHabitIndex === 0 && styles.carouselArrowDisabled
            ]}
            onPress={goToPreviousHabit}
            disabled={currentHabitIndex === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={28} 
              color={currentHabitIndex === 0 ? "#ccc" : "#0077B6"} 
            />
          </TouchableOpacity>
          
          {/* Tarjeta de hábito actual */}
          <View style={styles.carouselCardContainer}>
            {renderHabitCardLarge(selectedHabit)}
          </View>
          
          {/* Botón siguiente */}
          <TouchableOpacity 
            style={[
              styles.carouselArrow,
              currentHabitIndex === habits.length - 1 && styles.carouselArrowDisabled
            ]}
            onPress={goToNextHabit}
            disabled={currentHabitIndex === habits.length - 1}
          >
            <Ionicons 
              name="chevron-forward" 
              size={28} 
              color={currentHabitIndex === habits.length - 1 ? "#ccc" : "#0077B6"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Indicadores de página */}
        <View style={styles.paginationContainer}>
          {habits.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.paginationDot,
                index === currentHabitIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>
    );
  };
  
  // Renderizar tarjeta de hábito grande para el carrusel
  const renderHabitCardLarge = (habit: HabitTracker) => {
    const log = logs[selectedDate]?.[habit.id];
    const isCompleted = log ? log.completion_level > 0 : false;
    const completionLevel = log ? log.completion_level : 0;
    
    // Obtener icono para este tipo de hábito
    const habitIcon = HABIT_ICONS[habit.habit.habit_type] || <Ionicons name="checkmark-circle-outline" size={32} color="#0077B6" />;
    
    return (
      <View style={styles.habitCardLarge}>
        <View style={styles.habitCardLargeHeader}>
          <View style={styles.habitIconContainerLarge}>
            {React.cloneElement(habitIcon as React.ReactElement, { size: 32 })}
          </View>
          
          <View style={styles.habitInfoLarge}>
            <Text style={styles.habitNameLarge}>
              {habit.habit.text}
            </Text>
            
            {habit.streak && habit.streak.current_streak > 0 && (
              <View style={styles.streakIndicatorLarge}>
                <Ionicons name="flame" size={18} color="#FF6B00" />
                <Text style={styles.streakTextLarge}>{habit.streak.current_streak}</Text>
              </View>
            )}
          </View>
          
          {isCompleted && (
            <View style={[
              styles.completionIndicatorLarge,
              { backgroundColor: COMPLETION_COLORS[completionLevel] }
            ]}>
              <Text style={styles.completionIndicatorTextLarge}>
                {COMPLETION_LABELS[completionLevel].emoji}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.habitCardLargeBody}>
          <Text style={styles.habitDescriptionLarge}>
            {habit.habit.description || "Registra tu progreso con este hábito para mejorar tu salud digestiva."}
          </Text>
          
          <View style={styles.progressBarLarge}>
            <View 
              style={[
                styles.progressFillLarge,
                { width: `${(habit.current_score / habit.target_score) * 100}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.progressTextLarge}>
            {habit.current_score}/{habit.target_score}
          </Text>
        </View>
      </View>
    );
  };
  
  // Componente para selección de nivel de completado
  const renderCompletionLevelSelector = () => {
    if (!selectedHabit) return null;
    
    // Verificar si es el día actual
    const isCurrentDay = selectedDate === today;
    
    return (
      <Animated.View 
        style={[
          styles.completionSelector,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        <Text style={styles.selectorTitle}>
          {isCurrentDay 
            ? "¿Cómo te ha ido hoy con este hábito?" 
            : "Registro del día " + new Date(selectedDate).toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})
          }
        </Text>
        
        <View style={styles.completionLevels}>
          {[0, 1, 2, 3].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.completionLevelButton,
                completionLevel === level && styles.selectedCompletionLevel,
                { backgroundColor: completionLevel === level ? COMPLETION_COLORS[level] : '#F8F9FA' }
              ]}
              onPress={() => {
                if (isCurrentDay) {
                  setCompletionLevel(level);
                  
                  // Animación
                  Animated.sequence([
                    Animated.timing(scaleAnim, {
                      toValue: 1.03,
                      duration: 100,
                      useNativeDriver: true
                    }),
                    Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true
                    })
                  ]).start();
                }
              }}
              disabled={!isCurrentDay}
              activeOpacity={isCurrentDay ? 0.7 : 1}
            >
              <Text style={styles.completionEmoji}>{COMPLETION_LABELS[level].emoji}</Text>
              <Text style={[
                styles.completionLevelText,
                completionLevel === level && styles.selectedCompletionLevelText,
                !isCurrentDay && styles.disabledCompletionLevelText
              ]}>
                {COMPLETION_LABELS[level].text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notas (opcional):</Text>
          <TextInput
            style={[
              styles.notesInput,
              !isCurrentDay && styles.disabledNotesInput
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder={isCurrentDay 
              ? "¿Alguna observación sobre tu experiencia hoy?" 
              : "No puedes editar notas de días pasados"
            }
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            editable={isCurrentDay}
          />
        </View>
        
        {isCurrentDay ? (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveHabitLog}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.pastDateMessage}>
            <Text style={styles.pastDateMessageText}>
              Solo puedes registrar hábitos para el día actual
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent title="Seguimiento de Hábitos" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando tus hábitos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHabits}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          {/* Calendario simplificado */}
          {renderSimpleCalendar()}
          
          {/* Sección de progreso diario */}
          {renderDailyProgress()}
          
          {/* Carrusel de hábitos */}
          {renderHabitsCarousel()}
          
          {/* Selector de nivel de completado */}
          {renderCompletionLevelSelector()}
          
          {/* Mensaje de éxito */}
          {showSuccessMessage && (
            <View style={styles.successMessageContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
              <Text style={styles.successMessageText}>
                ¡Registro guardado! Racha actual: {selectedHabit?.streak?.current_streak || 1} días
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Barra de navegación inferior */}
      <TabNavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
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
    marginTop: 16,
    fontSize: 16,
    color: '#0077B6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0077B6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Estilo del calendario simplificado
  calendarContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 70,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F5F8FA',
    paddingVertical: 8,
  },
  selectedCalendarDay: {
    backgroundColor: '#0077B6',
  },
  todayCalendarDay: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  calendarDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  calendarDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedCalendarDayText: {
    color: 'white',
  },
  todayCalendarDayText: {
    fontWeight: 'bold',
  },
  calendarDayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  calendarDayComplete: {
    backgroundColor: '#4CAF50',
  },
  calendarDayPartial: {
    backgroundColor: '#FFC107',
  },
  todayCalendarDayIndicator: {
    backgroundColor: '#4CAF50',
  },
  // Sección de progreso
  progressSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressCircleOuter: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressCircleInner: {
    height: '100%',
    backgroundColor: '#0077B6',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  dateDisplay: {
    marginBottom: 10,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#005f73',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Carrusel de hábitos
  habitsListContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  carouselArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
  },
  carouselArrowDisabled: {
    backgroundColor: '#F5F5F5',
  },
  carouselCardContainer: {
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#0077B6',
    width: 16,
  },
  // Tarjeta de hábito grande
  habitCardLarge: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginHorizontal: 10,
  },
  habitCardLargeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  habitIconContainerLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitInfoLarge: {
    flex: 1,
  },
  habitNameLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 4,
  },
  streakIndicatorLarge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakTextLarge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginLeft: 4,
  },
  completionIndicatorLarge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  completionIndicatorTextLarge: {
    fontSize: 16,
  },
  habitCardLargeBody: {
    marginTop: 8,
  },
  habitDescriptionLarge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#0077B6',
    borderRadius: 4,
  },
  progressTextLarge: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  // Selector de nivel de completado
  completionSelector: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  completionLevelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCompletionLevel: {
    borderColor: '#0077B6',
    borderWidth: 2,
  },
  completionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  completionLevelText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  selectedCompletionLevelText: {
    color: '#0077B6',
    fontWeight: 'bold',
  },
  disabledCompletionLevelText: {
    color: '#AAA',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#005f73',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disabledNotesInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  pastDateMessage: {
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    alignItems: 'center',
  },
  pastDateMessageText: {
    color: '#856404',
    fontSize: 14,
  },
  // Mensaje de éxito
  successMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 10,
  },
  successMessageText: {
    color: '#155724',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  // Barra de navegación
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0077B6',
    paddingBottom: 5,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#0077B6',
    fontWeight: 'bold',
  },
  tabLabelInactive: {
    fontSize: 12,
    marginTop: 4,
    color: '#666666',
  },
});