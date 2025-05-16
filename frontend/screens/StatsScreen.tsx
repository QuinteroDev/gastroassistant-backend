// screens/StatsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity
} from 'react-native';
import HeaderComponent from '../components/HeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';

// Iconos para tipos de hábitos
const HABIT_ICONS = {
  'MEAL_SIZE': <MaterialCommunityIcons name="food-variant" size={24} color="#0077B6" />,
  'MEAL_TIME': <Ionicons name="time-outline" size={24} color="#0077B6" />,
  'POSTURE': <Ionicons name="body-outline" size={24} color="#0077B6" />,
  'EVENING_MEAL': <Ionicons name="moon-outline" size={24} color="#0077B6" />,
  'ALCOHOL': <Ionicons name="wine-outline" size={24} color="#0077B6" />,
  'TOBACCO': <MaterialCommunityIcons name="smoking-off" size={24} color="#0077B6" />,
  'HYDRATION_MEALS': <Ionicons name="water-outline" size={24} color="#0077B6" />,
  'HYDRATION_DAY': <Ionicons name="water" size={24} color="#0077B6" />,
  'CHEWING': <MaterialCommunityIcons name="food-apple" size={24} color="#0077B6" />
};

export default function StatsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    weeklyProgress: 0,
    totalDaysLogged: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedHabits: 0,
    topHabit: {
      name: "",
      streak: 0,
      type: ""
    },
    areas: {
      strengths: [],
      weaknesses: []
    }
  });
  
  // Cargar datos reales del backend
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Obtener datos de hábitos del usuario
        const habitsResponse = await api.get('/api/habits/');
        
        if (!habitsResponse.data || !Array.isArray(habitsResponse.data)) {
          throw new Error('Formato de respuesta inesperado');
        }
        
        const habits = habitsResponse.data;
        
        // Calcular estadísticas
        let totalLogs = 0;
        let completedHabits = 0;
        let currentMaxStreak = 0;
        let longestMaxStreak = 0;
        let topHabitData = { name: "", streak: 0, type: "" };
        let weeklyCompletionRate = 0;
        const strengths = [];
        const weaknesses = [];
        
        // Procesar cada hábito
        for (const habit of habits) {
          try {
            // Obtener historial de logs para este hábito
            const historyResponse = await api.get(`/api/habits/${habit.habit.id}/history/`, {
              params: { days: 30 } // Obtener datos de 30 días para análisis
            });
            
            if (historyResponse.data && Array.isArray(historyResponse.data)) {
              const logs = historyResponse.data;
              
              // Contar registros completados (nivel > 0)
              const completedLogs = logs.filter(log => log.completion_level > 0).length;
              totalLogs += completedLogs;
              
              // Verificar rachas
              if (habit.streak) {
                if (habit.streak.current_streak > currentMaxStreak) {
                  currentMaxStreak = habit.streak.current_streak;
                }
                
                if (habit.streak.longest_streak > longestMaxStreak) {
                  longestMaxStreak = habit.streak.longest_streak;
                }
                
                // Encontrar el hábito con mayor racha
                if (habit.streak.current_streak > topHabitData.streak) {
                  topHabitData = {
                    name: habit.habit.text,
                    streak: habit.streak.current_streak,
                    type: habit.habit.habit_type
                  };
                }
              }
              
              // Calcular tasa de cumplimiento semanal
              const lastSevenDaysLogs = logs.filter(log => {
                const logDate = new Date(log.date);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return logDate >= oneWeekAgo;
              });
              
              const weeklyCompletionCount = lastSevenDaysLogs.filter(log => log.completion_level > 0).length;
              const potentialCompletions = Math.min(7, lastSevenDaysLogs.length);
              const habitCompletionRate = potentialCompletions > 0 ? weeklyCompletionCount / potentialCompletions : 0;
              
              // Clasificar hábito como fortaleza o debilidad
              if (habitCompletionRate >= 0.7) {
                strengths.push({
                  name: habit.habit.text,
                  rate: habitCompletionRate
                });
              } else if (habitCompletionRate <= 0.3 && lastSevenDaysLogs.length > 0) {
                weaknesses.push({
                  name: habit.habit.text,
                  rate: habitCompletionRate
                });
              }
            }
          } catch (err) {
            console.error(`Error al obtener historial para hábito ${habit.habit.id}:`, err);
          }
        }
        
        // Calcular progreso semanal general (últimos 7 días vs. potencial total)
        const totalPotentialWeeklyLogs = habits.length * 7; // 7 días para cada hábito
        const weeklyProgress = totalPotentialWeeklyLogs > 0 ? 
          Math.min(1, totalLogs / totalPotentialWeeklyLogs) : 0;
        
        // Actualizar el estado con datos calculados
        setStats({
          weeklyProgress: weeklyProgress,
          totalDaysLogged: totalLogs,
          currentStreak: currentMaxStreak,
          longestStreak: longestMaxStreak,
          completedHabits: totalLogs,
          topHabit: topHabitData,
          areas: {
            strengths: strengths.slice(0, 2), // Las 2 principales fortalezas
            weaknesses: weaknesses.slice(0, 2) // Las 2 principales debilidades
          }
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setError("No pudimos cargar tus estadísticas. Por favor, intenta más tarde.");
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, []);
  
  // Renderizar barra de progreso semanal
  const renderProgressBar = (progress, label) => {
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>{label}</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
      </View>
    );
  };
  
  // Renderizar tarjeta de estadística
  const renderStatCard = (icon, title, value, subtitle = null) => {
    return (
      <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
          {icon}
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    );
  };
  
  // Renderizar recomendaciones basadas en estadísticas
  const renderRecommendations = () => {
    return (
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recomendaciones</Text>
        
        {stats.currentStreak > 0 && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={24} color="#0077B6" />
              <Text style={styles.recommendationTitle}>Buen trabajo con tus hábitos</Text>
            </View>
            <Text style={styles.recommendationText}>
              Has registrado tus hábitos durante {stats.currentStreak} días seguidos. 
              ¡Sigue así para mejorar tu racha!
            </Text>
          </View>
        )}
        
        {stats.areas.weaknesses.length > 0 && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="trending-up" size={24} color="#0077B6" />
              <Text style={styles.recommendationTitle}>Enfócate en mejorar</Text>
            </View>
            <Text style={styles.recommendationText}>
              Podrías mejorar en "{stats.areas.weaknesses[0]?.name || 'completar tus hábitos'}". 
              Intenta establecer recordatorios diarios para mantener la consistencia.
            </Text>
          </View>
        )}
        
        {stats.areas.strengths.length > 0 && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="star" size={24} color="#0077B6" />
              <Text style={styles.recommendationTitle}>Tu fortaleza</Text>
            </View>
            <Text style={styles.recommendationText}>
              Estás haciendo un excelente trabajo con "{stats.areas.strengths[0]?.name || 'tus hábitos'}".
              Mantén este buen hábito, ¡está contribuyendo positivamente a tu salud digestiva!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  const getHabitIcon = (habitType) => {
    return HABIT_ICONS[habitType] || <Ionicons name="checkmark-circle" size={24} color="#0077B6" />;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent title="Estadísticas" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando tus estadísticas...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          {/* Cabecera de estadísticas */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#00B4D8', '#0077B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>Resumen de tu Progreso</Text>
              <Text style={styles.headerSubtitle}>
                Tus estadísticas de seguimiento de hábitos
              </Text>
              
              {/* Progreso semanal */}
              {renderProgressBar(stats.weeklyProgress, "Progreso semanal")}
            </LinearGradient>
          </View>
          
          {/* Tarjetas de estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              {renderStatCard(
                <Ionicons name="calendar" size={28} color="#0077B6" />,
                "Registros completados",
                stats.totalDaysLogged,
                "total de actividades"
              )}
              
              {renderStatCard(
                <Ionicons name="flame" size={28} color="#FF6B00" />,
                "Racha actual",
                stats.currentStreak,
                "días consecutivos"
              )}
            </View>
            
            <View style={styles.statsRow}>
              {renderStatCard(
                <MaterialCommunityIcons name="trophy" size={28} color="#FFC107" />,
                "Racha más larga",
                stats.longestStreak,
                "días consecutivos"
              )}
              
              {renderStatCard(
                <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />,
                "Hábitos completados",
                stats.completedHabits,
                "en total"
              )}
            </View>
            
            {/* Mejor hábito */}
            {stats.topHabit.name && (
              <View style={styles.topHabitCard}>
                <View style={styles.topHabitHeader}>
                  {stats.topHabit.type && getHabitIcon(stats.topHabit.type)}
                  {!stats.topHabit.type && <MaterialCommunityIcons name="star" size={28} color="#FFC107" />}
                  <Text style={styles.topHabitTitle}>Tu mejor hábito</Text>
                </View>
                
                <View style={styles.topHabitContent}>
                  <Text style={styles.topHabitName}>{stats.topHabit.name}</Text>
                  <View style={styles.topHabitStreak}>
                    <Ionicons name="flame" size={18} color="#FF6B00" />
                    <Text style={styles.topHabitStreakText}>
                      Racha de {stats.topHabit.streak} días
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {/* Recomendaciones basadas en estadísticas */}
          {renderRecommendations()}
          
          {/* Sección de próximas características */}
          <View style={styles.comingSoonSection}>
            <View style={styles.comingSoonHeader}>
              <Ionicons name="time-outline" size={24} color="#0077B6" />
              <Text style={styles.comingSoonTitle}>Próximamente</Text>
            </View>
            
            <Text style={styles.comingSoonText}>
              Estamos trabajando en gráficos detallados y análisis avanzados
              para ayudarte a visualizar mejor tu progreso. ¡Vuelve pronto!
            </Text>
          </View>
        </ScrollView>
      )}
      
      {/* Barra de navegación */}
      <TabNavigationBar />
    </SafeAreaView>
  );
}

// Los estilos se mantienen igual que en el original
const styles = StyleSheet.create({
  // ... [mantener los estilos existentes]
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    marginTop: 16,
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
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
  // Cabecera
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  header: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  // Barra de progreso
  progressContainer: {
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  progressPercentage: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'right',
  },
  // Tarjetas de estadísticas
  statsContainer: {
    padding: 16,
    marginTop: -20,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077B6',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  // Tarjeta de mejor hábito
  topHabitCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  topHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topHabitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  topHabitContent: {
    marginLeft: 12,
  },
  topHabitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0077B6',
    marginBottom: 8,
  },
  topHabitStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topHabitStreakText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginLeft: 6,
  },
  // Sección de recomendaciones
  recommendationsSection: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0077B6',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0077B6',
    marginLeft: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Sección de próximas características
  comingSoonSection: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0077B6',
    marginLeft: 10,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});