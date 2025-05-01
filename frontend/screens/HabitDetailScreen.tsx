// screens/HabitDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { getData } from '../utils/storage';
import CustomButton from '../components/CustomButton';
import HeaderComponent from '../components/HeaderComponent';

type HabitDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetail'>;
type HabitDetailRouteProp = RouteProp<RootStackParamList, 'HabitDetail'>;

export default function HabitDetailScreen() {
  const navigation = useNavigation<HabitDetailNavigationProp>();
  const route = useRoute<HabitDetailRouteProp>();
  const { habitId } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [habit, setHabit] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHabitData();
  }, [habitId]);

  const loadHabitData = async () => {
    setIsLoading(true);
    try {
      // Cargar datos del hábito
      const response = await api.get(`/api/habits/${habitId}`);
      setHabit(response.data);
      
      // Cargar historial de logs
      const logsResponse = await api.get(`/api/habits/${habitId}/history/`);
      setLogs(logsResponse.data);
      
      // Obtener información de racha
      if (response.data.streak) {
        setStreak(response.data.streak);
      }
    } catch (error) {
      console.error('Error al cargar datos del hábito:', error);
      setError('No se pudieron cargar los datos del hábito. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogHabit = async (completion_level: number) => {
    try {
      // Registrar el hábito para hoy
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      await api.post('/api/habits/log/', {
        habit_id: habitId,
        date: today,
        completion_level,
        notes: `Registrado desde la pantalla de detalle`
      });
      
      // Recargar los datos para mostrar el cambio
      loadHabitData();
      
      Alert.alert(
        'Hábito registrado',
        'El hábito ha sido registrado correctamente para hoy.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error al registrar hábito:', error);
      Alert.alert(
        'Error',
        'No se pudo registrar el hábito. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077B6" />
        <Text style={styles.loadingText}>Cargando datos del hábito...</Text>
      </View>
    );
  }

  if (error || !habit) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color="#D8000C" />
        <Text style={styles.errorText}>{error || 'Error al cargar los datos del hábito'}</Text>
        <CustomButton 
          title="Intentar de nuevo" 
          onPress={loadHabitData} 
          type="primary"
          size="medium"
        />
      </View>
    );
  }

  // Mostrar nivel en formato legible
  const getCompletionLevelText = (level: number) => {
    switch (level) {
      case 0: return 'No completado';
      case 1: return 'Parcialmente completado';
      case 2: return 'Mayormente completado';
      case 3: return 'Completamente logrado';
      default: return 'Desconocido';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <HeaderComponent showBackButton={true} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.habitHeaderCard}>
          <Text style={styles.habitTitle}>{habit.habit ? habit.habit.text : 'Hábito'}</Text>
          <Text style={styles.habitType}>{habit.habit ? habit.habit.description : ''}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{habit.current_score}/3</Text>
              <Text style={styles.statLabel}>Nivel actual</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Racha actual</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak?.longest_streak || 0}</Text>
              <Text style={styles.statLabel}>Mejor racha</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Registrar para hoy</Text>
          <Text style={styles.actionSubtitle}>¿Cómo te ha ido con este hábito hoy?</Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.levelButton, { backgroundColor: '#FFD6D6' }]}
              onPress={() => handleLogHabit(0)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#D8000C" />
              <Text style={[styles.levelButtonText, { color: '#D8000C' }]}>No lo hice</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.levelButton, { backgroundColor: '#FFF4D6' }]}
              onPress={() => handleLogHabit(1)}
            >
              <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="#FFA000" />
              <Text style={[styles.levelButtonText, { color: '#FFA000' }]}>Parcial</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.levelButton, { backgroundColor: '#D6FFDB' }]}
              onPress={() => handleLogHabit(2)}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#00A000" />
              <Text style={[styles.levelButtonText, { color: '#00A000' }]}>Bien</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.levelButton, { backgroundColor: '#D6F0FF' }]}
              onPress={() => handleLogHabit(3)}
            >
              <Ionicons name="star-outline" size={24} color="#0077B6" />
              <Text style={[styles.levelButtonText, { color: '#0077B6' }]}>Excelente</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Historial Reciente</Text>
          
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.dateText}>{new Date(log.date).toLocaleDateString()}</Text>
                </View>
                
                <View style={[
                  styles.historyLevel,
                  log.completion_level === 0 ? styles.levelNotDone : 
                  log.completion_level === 1 ? styles.levelPartial :
                  log.completion_level === 2 ? styles.levelGood :
                  styles.levelExcellent
                ]}>
                  <Text style={styles.levelText}>
                    {getCompletionLevelText(log.completion_level)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>
              No hay registros disponibles aún. ¡Comienza a registrar tu progreso!
            </Text>
          )}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Consejos para mejorar</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={24} color="#0077B6" />
            <Text style={styles.tipText}>
              Establece recordatorios diarios para mantener la consistencia.
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="calendar-outline" size={24} color="#0077B6" />
            <Text style={styles.tipText}>
              Pequeños cambios sostenidos en el tiempo son más efectivos que grandes cambios esporádicos.
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="trophy-outline" size={24} color="#0077B6" />
            <Text style={styles.tipText}>
              Celebra tus logros, incluso los pequeños. ¡Cada día cuenta!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
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
    backgroundColor: '#F5F8FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D8000C',
    textAlign: 'center',
    marginVertical: 20,
  },
  habitHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  habitTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 5,
  },
  habitType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077B6',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  levelButton: {
    width: '48%',
    backgroundColor: '#F5F8FA',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyDate: {
    width: '40%',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  historyLevel: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  levelNotDone: {
    backgroundColor: '#FFD6D6',
  },
  levelPartial: {
    backgroundColor: '#FFF4D6',
  },
  levelGood: {
    backgroundColor: '#D6FFDB',
  },
  levelExcellent: {
    backgroundColor: '#D6F0FF',
  },
  levelText: {
    fontSize: 14,
    textAlign: 'center',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});