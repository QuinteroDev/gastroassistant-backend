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

export default function StatsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    weeklyProgress: 0.65, // Ejemplo: 65% de progreso esta semana
    totalDaysLogged: 12,
    currentStreak: 3,
    longestStreak: 5,
    completedHabits: 18,
    topHabit: {
      name: "Evitar comidas copiosas",
      streak: 5,
      type: "MEAL_SIZE"
    }
  });
  
  // Simular carga de datos
  useEffect(() => {
    const loadStats = async () => {
      try {
        // En una versión real, aquí harías la llamada API
        // const response = await api.get('/api/stats/');
        // setStats(response.data);
        
        // Simular retraso de carga
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
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
        
        <View style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="trending-up" size={24} color="#0077B6" />
            <Text style={styles.recommendationTitle}>Enfócate en tu debilidad</Text>
          </View>
          <Text style={styles.recommendationText}>
            Tus registros muestran que podrías mejorar en mantener una hidratación 
            adecuada. Intenta beber agua regularmente a lo largo del día.
          </Text>
        </View>
      </View>
    );
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
                "Días registrados",
                stats.totalDaysLogged,
                "desde que comenzaste"
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
            <View style={styles.topHabitCard}>
              <View style={styles.topHabitHeader}>
                <MaterialCommunityIcons name="star" size={28} color="#FFC107" />
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

const styles = StyleSheet.create({
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