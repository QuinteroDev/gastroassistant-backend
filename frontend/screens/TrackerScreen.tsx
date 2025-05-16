// screens/TrackerScreen.tsx
import React, { useState, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../utils/api';
import TabNavigationBar from '../components/TabNavigationBar';

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
  is_promoted: boolean; // Añadido para identificar el hábito promocionado
  current_score: number;
  target_score: number;
  streak?: {
    current_streak: number;
    longest_streak: number;
  };
}

// Iconos para tipos de hábitos
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

// Colores para niveles de completado (más sutiles)
const COMPLETION_COLORS = {
  0: '#fff1f1', // Rojizo muy suave para "No logrado"
  1: '#fff8e6', // Amarillo suave para "Parcialmente"
  2: '#edf7ff', // Azul suave para "Bastante bien"
  3: '#f0fff4'  // Verde suave para "Excelente"
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
    month: 'long',
    year: 'numeric'
  });
};

const today = getToday();
const todayFormatted = formatDisplayDate();

// Componente principal
export default function TrackerScreen() {
  const navigation = useNavigation<TrackerScreenNavigationProp>();
  const [habits, setHabits] = useState<HabitTracker[]>([]);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number>(0);
  const [completionLevel, setCompletionLevel] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<number>(0);
  const [completionLevels, setCompletionLevels] = useState<{[key: number]: number}>({});
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);

  // Cargar datos al inicio
  useEffect(() => {
    loadHabits();
  }, []);

  // Función para cargar hábitos
  const loadHabits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/habits/');
      let habitData: HabitTracker[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        // Limitar a 5 hábitos como solicitado
        habitData = response.data.slice(0, 5);
        setHabits(habitData);
        
        // Cargar los logs de hábitos para hoy y calcular el progreso
        if (habitData.length > 0) {
          let completedHabits = 0;
          const completionMap = {};
          
          try {
            // Obtener logs para el día de hoy
            for (const habit of habitData) {
              try {
                const logsResponse = await api.get(`/api/habits/${habit.habit.id}/history/`, {
                  params: { days: 1 }
                });
                
                if (logsResponse.data && Array.isArray(logsResponse.data)) {
                  // Buscar registro para el día de hoy
                  const todayLog = logsResponse.data.find(log => log.date === today && log.tracker_id === habit.id);
                  
                  if (todayLog && todayLog.completion_level > 0) {
                    completedHabits++;
                    completionMap[habit.id] = todayLog.completion_level;
                  } else {
                    completionMap[habit.id] = 0;
                  }
                }
              } catch (err) {
                console.error(`Error al cargar logs para hábito ${habit.habit.id}:`, err);
              }
            }
            
            // Calcular progreso como porcentaje
            const progress = habitData.length > 0 ? 
              (completedHabits / habitData.length) * 100 : 0;
            
            setDailyProgress(progress);
            setCompletionLevels(completionMap);
            
            // Si hay un nivel de completado para el hábito seleccionado, establecerlo
            if (habitData.length > 0 && completionMap[habitData[0].id] !== undefined) {
              setCompletionLevel(completionMap[habitData[0].id]);
            }
          } catch (err) {
            console.error("Error al cargar logs:", err);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar hábitos:', err);
      setError('No pudimos cargar tus hábitos. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar un registro de hábito
  const saveHabitLog = async () => {
    if (habits.length === 0) return;
    
    const selectedHabit = habits[selectedHabitIndex];
    setIsSaving(true);
    
    try {
      const data = {
        tracker_id: selectedHabit.id,
        habit_id: selectedHabit.habit.id,
        date: today,
        completion_level: completionLevel,
        notes: notes
      };
      
      const response = await api.post('/api/habits/log/', data);
      
      // Actualizar el nivel de completado en el estado local
      const updatedLevels = { ...completionLevels };
      updatedLevels[selectedHabit.id] = completionLevel;
      setCompletionLevels(updatedLevels);
      
      // Recalcular el progreso diario
      const completedHabits = Object.values(updatedLevels).filter(level => level > 0).length;
      const newProgress = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0;
      setDailyProgress(newProgress);
      
      setSuccessMessage('¡Hábito registrado con éxito!');
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error al guardar el registro:', err);
      Alert.alert('Error', 'No pudimos guardar tu registro. Intenta de nuevo más tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  // Función para cambiar al hábito anterior
  const goToPreviousHabit = () => {
    if (selectedHabitIndex > 0) {
      const newIndex = selectedHabitIndex - 1;
      setSelectedHabitIndex(newIndex);
      
      // Actualizar el nivel de completado según el hábito seleccionado
      const habitId = habits[newIndex].id;
      if (completionLevels[habitId] !== undefined) {
        setCompletionLevel(completionLevels[habitId]);
      } else {
        setCompletionLevel(0);
      }
      
      // Limpiar notas al cambiar de hábito
      setNotes('');
    }
  };

  // Función para cambiar al hábito siguiente
  const goToNextHabit = () => {
    if (selectedHabitIndex < habits.length - 1) {
      const newIndex = selectedHabitIndex + 1;
      setSelectedHabitIndex(newIndex);
      
      // Actualizar el nivel de completado según el hábito seleccionado
      const habitId = habits[newIndex].id;
      if (completionLevels[habitId] !== undefined) {
        setCompletionLevel(completionLevels[habitId]);
      } else {
        setCompletionLevel(0);
      }
      
      // Limpiar notas al cambiar de hábito
      setNotes('');
    }
  };

  // Opciones de nivel de cumplimiento
  const completionOptions = [
    { value: 0, label: 'No logrado', emoji: '😔' },
    { value: 1, label: 'Parcialmente', emoji: '🙂' },
    { value: 2, label: 'Bastante bien', emoji: '😊' },
    { value: 3, label: 'Excelente', emoji: '🎉' },
  ];

  // Componente para la fecha de hoy
  const renderTodayDate = () => {
    return (
      <View style={styles.dateContainer}>
        <View style={styles.dateInfoContainer}>
          <Ionicons name="calendar" size={22} color="#0077B6" style={styles.dateIcon} />
          <Text style={styles.dateText}>{todayFormatted}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{Math.round(dailyProgress)}% completado hoy</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${dailyProgress}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  // Componente para la navegación entre hábitos
  const renderHabitNavigation = () => {
    if (habits.length <= 1) return null;
    
    return (
      <View style={styles.habitNavigationContainer}>
        <TouchableOpacity 
          style={[
            styles.navigationButton,
            selectedHabitIndex === 0 && styles.navigationButtonDisabled
          ]}
          onPress={goToPreviousHabit}
          disabled={selectedHabitIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={selectedHabitIndex === 0 ? "#ccc" : "#0077B6"} 
          />
        </TouchableOpacity>
        
        <View style={styles.habitCountContainer}>
          <Text style={styles.habitCountText}>
            {selectedHabitIndex + 1} de {habits.length}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.navigationButton,
            selectedHabitIndex === habits.length - 1 && styles.navigationButtonDisabled
          ]}
          onPress={goToNextHabit}
          disabled={selectedHabitIndex === habits.length - 1}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={selectedHabitIndex === habits.length - 1 ? "#ccc" : "#0077B6"} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Modal de información
  const renderInfoModal = () => {
    if (!habits.length) return null;
    
    const selectedHabit = habits[selectedHabitIndex];
    
    return (
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Información del hábito</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                {selectedHabit?.habit.description || "No hay información adicional disponible para este hábito."}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar el contenido principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando tus hábitos...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={loadHabits}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (habits.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="clipboard-outline" size={50} color="#0077B6" />
          <Text style={styles.emptyText}>No tienes hábitos para seguir</Text>
          <Text style={styles.subText}>Completa el cuestionario de hábitos para comenzar</Text>
        </View>
      );
    }

    const selectedHabit = habits[selectedHabitIndex];
    const isPromoted = selectedHabit?.is_promoted || false;

    return (
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Componente de fecha de hoy */}
        {renderTodayDate()}
        
        {/* Navegación entre hábitos */}
        {renderHabitNavigation()}
        
        {/* Tarjeta de detalles del hábito */}
        <View style={styles.habitDetailsCard}>
          <View style={styles.habitHeaderContainer}>
            <View style={[
              styles.habitIconLarge,
              isPromoted && styles.promotedIconContainer
            ]}>
              {React.cloneElement(
                HABIT_ICONS[selectedHabit?.habit.habit_type] || 
                <Ionicons name="checkmark-circle-outline" size={28} color="#0077B6" />,
                { size: 28, color: isPromoted ? "#FF6B00" : "#0077B6" }
              )}
            </View>
            <View style={styles.habitTitleContainer}>
              <View style={styles.titleRow}>
                <Text style={[
                  styles.cardTitle,
                  isPromoted && styles.promotedTitle
                ]}>
                  {selectedHabit?.habit.text}
                </Text>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => setInfoModalVisible(true)}
                >
                  <Ionicons name="information-circle-outline" size={24} color={isPromoted ? "#FF6B00" : "#0077B6"} />
                </TouchableOpacity>
              </View>
              
              {isPromoted && (
                <View style={styles.promotedBadge}>
                  <Ionicons name="star" size={12} color="#FF6B00" />
                  <Text style={styles.promotedText}>Prioritario</Text>
                </View>
              )}
              
              {selectedHabit?.streak && selectedHabit.streak.current_streak > 0 && (
                <View style={styles.cardStreakContainer}>
                  <Ionicons name="flame" size={16} color="#FF6B00" />
                  <Text style={styles.cardStreakText}>
                    {selectedHabit.streak.current_streak} días consecutivos
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.logTitle}>¿Cómo te ha ido hoy con este hábito?</Text>
          
          <View style={styles.completionOptions}>
            {completionOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.completionOption,
                  completionLevel === option.value && styles.selectedOption,
                  completionLevel === option.value && { backgroundColor: COMPLETION_COLORS[option.value] }
                ]}
                onPress={() => setCompletionLevel(option.value)}
              >
                <Text style={styles.emoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  completionLevel === option.value && styles.selectedOptionLabel
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notas (opcional):</Text>
            <TextInput
              style={[
                styles.notesInput,
                completionLevel > 0 && { borderColor: '#0077B6' }
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="¿Alguna observación sobre tu experiencia?"
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveHabitLog}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Mensaje de éxito */}
        {successMessage && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
        
        {/* Espacio al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent title="Seguimiento de Hábitos" />
      {renderContent()}
      {renderInfoModal()}
      <TabNavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#0077B6',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0077B6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Contenedor de fecha
  dateContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#0077B6',
    marginBottom: 6,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0077B6',
    borderRadius: 4,
  },
  // Navegación entre hábitos
  habitNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  navigationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  habitCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  habitCountText: {
    fontSize: 14,
    color: '#0077B6',
    fontWeight: '500',
  },
  // Tarjeta de detalles
  habitDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  habitHeaderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  habitIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promotedIconContainer: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  habitTitleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 4,
    flex: 1,
    paddingRight: 8,
  },
  infoButton: {
    padding: 2,
  },
  promotedTitle: {
    color: '#FF6B00',
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  promotedText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStreakText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Sección de registro
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  // Opciones de completado con colores sutiles
  completionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  completionOption: {
    alignItems: 'center',
    width: '23%',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    borderColor: '#0077B6',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedOptionLabel: {
    color: '#0077B6',
    fontWeight: 'bold',
  },
  // Notas y guardar
  notesContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#0077B6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Mensaje de éxito
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  successText: {
    marginLeft: 8,
    color: '#155724',
    fontSize: 14,
  },
  // Modal de información
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077B6',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#0077B6',
    padding: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Espacio al final
  bottomSpacer: {
    height: 20,
  }
});