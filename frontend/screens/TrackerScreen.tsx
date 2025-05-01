// screens/TrackerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { getData } from '../utils/storage';
import HeaderComponent from '../components/HeaderComponent';

type TrackerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tracker'>;

// Interfaz para hábito a seguir
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
    last_log_date: string;
  };
}

// Interfaz para registro de hábito
interface HabitLog {
  id: number;
  tracker_id: number;
  date: string;
  completion_level: number;
  notes: string;
}

export default function TrackerScreen() {
  const navigation = useNavigation<TrackerNavigationProp>();
  const [habitTrackers, setHabitTrackers] = useState<HabitTracker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal de registro
  const [logModalVisible, setLogModalVisible] = useState<boolean>(false);
  const [selectedTracker, setSelectedTracker] = useState<HabitTracker | null>(null);
  const [completionLevel, setCompletionLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // Cargar hábitos al inicio
  useEffect(() => {
    const fetchHabitTrackers = async () => {
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
        const response = await api.get('/api/habits/my-trackers/');
        
        if (response.data) {
          console.log("Hábitos cargados:", response.data);
          setHabitTrackers(response.data);
        }
      } catch (err) {
        console.error("Error al cargar hábitos:", err);
        setError("Error al cargar tus hábitos para seguimiento");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHabitTrackers();
  }, [navigation]);
  
  // Abrir modal para registrar hábito
  const openLogModal = (tracker: HabitTracker) => {
    setSelectedTracker(tracker);
    setCompletionLevel(null);
    setNotes('');
    setLogModalVisible(true);
  };
  
  // Registrar cumplimiento de hábito
  const logHabit = async () => {
    if (!selectedTracker || completionLevel === null) {
      Alert.alert("Error", "Por favor, selecciona un nivel de cumplimiento");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const logData = {
        habit_id: selectedTracker.habit.id,
        date: today,
        completion_level: completionLevel,
        notes: notes
      };
      
      const response = await api.post('/api/habits/log/', logData);
      
      console.log("Hábito registrado:", response.data);
      
      // Actualizar el estado local
      const updatedTrackers = habitTrackers.map(tracker => 
        tracker.id === selectedTracker.id 
          ? {
              ...tracker,
              current_score: completionLevel >= 2 ? tracker.current_score + 1 : tracker.current_score,
              streak: {
                ...tracker.streak,
                current_streak: completionLevel >= 2 
                  ? (tracker.streak?.current_streak || 0) + 1 
                  : 0,
                longest_streak: completionLevel >= 2 
                  ? Math.max((tracker.streak?.longest_streak || 0), (tracker.streak?.current_streak || 0) + 1)
                  : (tracker.streak?.longest_streak || 0),
                last_log_date: today
              }
            }
          : tracker
      );
      
      setHabitTrackers(updatedTrackers);
      setLogModalVisible(false);
      
      // Mostrar mensaje de éxito
      Alert.alert("Hábito Registrado", "Has registrado tu hábito correctamente para hoy.");
    } catch (err) {
      console.error("Error al registrar hábito:", err);
      Alert.alert("Error", "No se pudo registrar el hábito. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Función para obtener el color según el nivel de cumplimiento
  const getCompletionColor = (level: number): string => {
    switch (level) {
      case 0: return '#dc3545'; // Rojo - No completado
      case 1: return '#fd7e14'; // Naranja - Parcialmente completado
      case 2: return '#20c997'; // Verde claro - Mayormente completado
      case 3: return '#198754'; // Verde - Completamente logrado
      default: return '#6c757d'; // Gris - No definido
    }
  };
  
  // Convertir nivel de cumplimiento a texto
  const getCompletionText = (level: number): string => {
    switch (level) {
      case 0: return 'No completado';
      case 1: return 'Parcialmente completado';
      case 2: return 'Mayormente completado';
      case 3: return 'Completamente logrado';
      default: return 'No registrado';
    }
  };
  
  // Renderizar tarjeta de hábito
  const renderHabitCard = (tracker: HabitTracker) => {
    const progress = (tracker.current_score / tracker.target_score) * 100;
    
    return (
      <View 
        key={tracker.id} 
        style={[
          styles.habitCard,
          tracker.is_promoted && styles.promotedCard
        ]}
      >
        <View style={styles.habitHeader}>
          {tracker.is_promoted && (
            <View style={styles.promotedBadge}>
              <Ionicons name="star" size={12} color="#ffffff" />
              <Text style={styles.promotedText}>Destacado</Text>
            </View>
          )}
          <Text style={styles.habitTitle}>{tracker.habit.text}</Text>
        </View>
        
        {tracker.habit.description && (
          <Text style={styles.habitDescription}>{tracker.habit.description}</Text>
        )}
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min(100, progress)}%` }
            ]} 
          />
        </View>
        
        <View style={styles.habitStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Puntuación</Text>
            <Text style={styles.statValue}>{tracker.current_score}/{tracker.target_score}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Racha actual</Text>
            <Text style={styles.statValue}>{tracker.streak?.current_streak || 0} días</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mejor racha</Text>
            <Text style={styles.statValue}>{tracker.streak?.longest_streak || 0} días</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => openLogModal(tracker)}
        >
          <Text style={styles.logButtonText}>Registrar Hoy</Text>
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <HeaderComponent />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando hábitos para seguimiento...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.retryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      ) : habitTrackers.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="clipboard-outline" size={48} color="#0077B6" />
          <Text style={styles.noHabitsText}>No hay hábitos configurados para seguimiento</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.retryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Seguimiento de Hábitos</Text>
            <Text style={styles.headerSubtitle}>
              Registra tus hábitos diariamente para mejorar tu salud digestiva
            </Text>
          </View>
          
          <View style={styles.habitsList}>
            {habitTrackers.map(tracker => renderHabitCard(tracker))}
          </View>
          
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Consejos para formar hábitos</Text>
            <Text style={styles.tipsText}>
              Mantener una racha de al menos 21 días ayuda a establecer un hábito permanente.
              Registra tu progreso diariamente y trata de lograr pequeñas mejoras consistentes.
            </Text>
          </View>
        </ScrollView>
      )}
      
      {/* Modal para registrar hábito */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logModalVisible}
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Hábito</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setLogModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedTracker && (
              <View style={styles.modalContent}>
                <Text style={styles.modalHabitTitle}>{selectedTracker.habit.text}</Text>
                <Text style={styles.modalDate}>Fecha: {today}</Text>
                
                <Text style={styles.modalSectionTitle}>Nivel de cumplimiento:</Text>
                
                {[0, 1, 2, 3].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.completionOption,
                      completionLevel === level && styles.selectedCompletionOption,
                      { borderColor: getCompletionColor(level) }
                    ]}
                    onPress={() => setCompletionLevel(level)}
                  >
                    <View style={[
                      styles.completionCircle,
                      { backgroundColor: getCompletionColor(level) }
                    ]}>
                      {completionLevel === level && (
                        <Ionicons name="checkmark" size={18} color="white" />
                      )}
                    </View>
                    <Text style={styles.completionText}>{getCompletionText(level)}</Text>
                  </TouchableOpacity>
                ))}
                
                <Text style={styles.modalSectionTitle}>Notas (opcional):</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Añade tus observaciones..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline={true}
                  maxLength={200}
                />
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={logHabit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar Registro</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.replace('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#666666" />
          <Text style={styles.tabLabelInactive}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, styles.activeTab]}
        >
          <Ionicons name="calendar" size={24} color="#0077B6" />
          <Text style={styles.tabLabel}>Tracker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => Alert.alert('Próximamente', 'Esta sección estará disponible pronto.')}
        >
          <Ionicons name="analytics-outline" size={24} color="#666666" />
          <Text style={styles.tabLabelInactive}>Estadísticas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => Alert.alert('Próximamente', 'Esta sección estará disponible pronto.')}
        >
          <Ionicons name="person-outline" size={24} color="#666666" />
          <Text style={styles.tabLabelInactive}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Espacio para la barra de navegación
  },
  headerSection: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  habitsList: {
    padding: 16,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  promotedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  promotedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077B6',
  },
  logButton: {
    backgroundColor: '#0077B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  tipsSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  noHabitsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0077B6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f73',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 16,
  },
  modalHabitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 12,
    marginTop: 16,
  },
  completionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedCompletionOption: {
    backgroundColor: 'rgba(0, 119, 182, 0.05)',
  },
  completionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completionText: {
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para la barra de navegación
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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