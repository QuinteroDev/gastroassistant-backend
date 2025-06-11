import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import MainHeaderComponent from '../components/MainHeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Tipos
interface StatsData {
  weeklyProgress: number;
  totalDaysTracked: number;
  currentStreak: number;
  longestStreak: number;
  completedHabits: number;
  avgCompletionRate: number;
  topHabit: {
    name: string;
    streak: number;
    completionRate: number;
  };
  gerdqScore: number | null;
  rsiScore: number | null;
  weeklyData: Array<{
    day: string;
    completed: number;
    total: number;
  }>;
}

const { width } = Dimensions.get('window');

// Función para obtener emoji según puntuación GERD-Q
const getGerdqEmoji = (score: number | null) => {
  if (score === null) return { emoji: '❓', label: 'Sin datos', color: '#999999' };
  if (score >= 8) return { emoji: '😟', label: 'Necesita atención', color: theme.colors.error.main };
  if (score >= 5) return { emoji: '😐', label: 'Síntomas moderados', color: theme.colors.warning.main };
  return { emoji: '😊', label: 'Buen control', color: theme.colors.success.main };
};

// Función para obtener emoji según puntuación RSI
const getRsiEmoji = (score: number | null) => {
  if (score === null) return { emoji: '❓', label: 'Sin datos', color: '#999999' };
  if (score >= 13) return { emoji: '😟', label: 'Síntomas significativos', color: theme.colors.error.main };
  if (score >= 7) return { emoji: '😐', label: 'Síntomas leves', color: theme.colors.warning.main };
  return { emoji: '😊', label: 'Mínimos síntomas', color: theme.colors.success.main };
};

// Días de la semana
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function StatsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData>({
    weeklyProgress: 0,
    totalDaysTracked: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedHabits: 0,
    avgCompletionRate: 0,
    topHabit: {
      name: "",
      streak: 0,
      completionRate: 0
    },
    gerdqScore: null,
    rsiScore: null,
    weeklyData: []
  });
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Cargar datos reales del backend
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Obtener perfil del usuario para scores
        const profileResponse = await api.get('/api/profiles/me/');
        console.log('Profile response:', profileResponse.data); // Debug para ver qué campos vienen
        
        // Buscar los scores con diferentes nombres posibles
        const gerdqScore = profileResponse.data?.gerdq_score || 
                          profileResponse.data?.gerdQ_score || 
                          profileResponse.data?.gerd_q_score ||
                          profileResponse.data?.GERDQ_score ||
                          null;
                          
        const rsiScore = profileResponse.data?.rsi_score || 
                        profileResponse.data?.RSI_score ||
                        profileResponse.data?.r_s_i_score ||
                        null;
        
        console.log('GERD-Q Score:', gerdqScore); // Debug
        console.log('RSI Score:', rsiScore); // Debug
        
        // Si no están en el perfil, intentar obtenerlos de completions
        let finalGerdqScore = gerdqScore;
        let finalRsiScore = rsiScore;
        
        if (finalGerdqScore === null || finalRsiScore === null) {
          try {
            const completionsResponse = await api.get('/api/questionnaires/completions/me/');
            console.log('Completions response:', completionsResponse.data);
            
            if (Array.isArray(completionsResponse.data)) {
              const gerdqCompletion = completionsResponse.data.find(
                (c: any) => c.questionnaire?.type === 'GERDQ'
              );
              const rsiCompletion = completionsResponse.data.find(
                (c: any) => c.questionnaire?.type === 'RSI'
              );
              
              if (gerdqCompletion && finalGerdqScore === null) {
                finalGerdqScore = gerdqCompletion.score;
              }
              if (rsiCompletion && finalRsiScore === null) {
                finalRsiScore = rsiCompletion.score;
              }
            }
          } catch (err) {
            console.error('Error al obtener completions:', err);
          }
        }
        
        // Obtener datos de hábitos
        const habitsResponse = await api.get('/api/habits/');
        
        if (!habitsResponse.data || !Array.isArray(habitsResponse.data)) {
          throw new Error('Formato de respuesta inesperado');
        }
        
        const habits = habitsResponse.data;
        
        // Calcular estadísticas
        let totalLogs = 0;
        let completedDays = new Set<string>();
        let currentMaxStreak = 0;
        let longestMaxStreak = 0;
        let topHabitData = { name: "", streak: 0, completionRate: 0 };
        let totalCompletionRate = 0;
        let habitCount = 0;
        
        // Datos semanales
        const weeklyMap = new Map<string, { completed: number; total: number; dayLabel: string }>();
        const today = new Date();
        
        // Inicializar los últimos 7 días
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Crear etiqueta con día y fecha
          const dayName = WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Ajustar para que Lunes sea 0
          const dayNumber = date.getDate();
          const dayLabel = `${dayName}\n${dayNumber}`;
          
          weeklyMap.set(dateStr, { 
            completed: 0, 
            total: habits.length,
            dayLabel: dayLabel 
          });
        }
        
        // Procesar cada hábito
        for (const habit of habits) {
          try {
            const historyResponse = await api.get(`/api/habits/${habit.habit.id}/history/`, {
              params: { days: 30 }
            });
            
            if (historyResponse.data && Array.isArray(historyResponse.data)) {
              const logs = historyResponse.data;
              
              // Contar registros y días únicos
              logs.forEach((log: any) => {
                if (log.completion_level > 0) {
                  totalLogs++;
                  completedDays.add(log.date);
                  
                  // Actualizar datos semanales
                  if (weeklyMap.has(log.date)) {
                    const dayData = weeklyMap.get(log.date)!;
                    dayData.completed++;
                    weeklyMap.set(log.date, dayData);
                  }
                }
              });
              
              // Verificar rachas
              if (habit.streak) {
                currentMaxStreak = Math.max(currentMaxStreak, habit.streak.current_streak);
                longestMaxStreak = Math.max(longestMaxStreak, habit.streak.longest_streak);
                
                // Calcular tasa de completado para este hábito
                const completedCount = logs.filter((log: any) => log.completion_level > 0).length;
                const daysWithLogs = new Set(logs.map((log: any) => log.date)).size;
                const habitCompletionRate = daysWithLogs > 0 ? completedCount / daysWithLogs : 0;
                
                // Encontrar el mejor hábito
                if (habit.streak.current_streak > topHabitData.streak || 
                    (habit.streak.current_streak === topHabitData.streak && habitCompletionRate > topHabitData.completionRate)) {
                  topHabitData = {
                    name: habit.habit.text,
                    streak: habit.streak.current_streak,
                    completionRate: habitCompletionRate
                  };
                }
                
                totalCompletionRate += habitCompletionRate;
                habitCount++;
              }
            }
          } catch (err) {
            console.error(`Error al obtener historial para hábito ${habit.habit.id}:`, err);
          }
        }
        
        // Convertir weeklyMap a array
        const weeklyData = Array.from(weeklyMap.entries()).map(([date, data], index) => ({
          day: data.dayLabel,
          completed: data.completed,
          total: data.total
        }));
        
        // Calcular progreso semanal
        const totalPossible = habits.length * 7;
        const weeklyProgress = totalPossible > 0 ? totalLogs / totalPossible : 0;
        const avgCompletion = habitCount > 0 ? totalCompletionRate / habitCount : 0;
        
        // Actualizar el estado
        setStats({
          weeklyProgress: Math.min(1, weeklyProgress),
          totalDaysTracked: completedDays.size,
          currentStreak: currentMaxStreak,
          longestStreak: longestMaxStreak,
          completedHabits: totalLogs,
          avgCompletionRate: avgCompletion,
          topHabit: topHabitData,
          gerdqScore: finalGerdqScore,
          rsiScore: finalRsiScore,
          weeklyData: weeklyData
        });
        
        // Animaciones de entrada
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 800,
            delay: 300,
            useNativeDriver: false,
          }),
        ]).start();
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setError("No pudimos cargar tus estadísticas. Por favor, intenta más tarde.");
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, []);
  
  // Renderizar gráfico de emojis para scores
  const renderScoreCard = (
    title: string, 
    score: number | null, 
    getEmoji: (score: number | null) => any,
    icon: JSX.Element
  ) => {
    const emojiData = getEmoji(score);
    
    return (
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          {icon}
          <Text style={styles.scoreTitle}>{title}</Text>
        </View>
        
        <View style={styles.scoreContent}>
          <Text style={styles.scoreEmoji}>{emojiData.emoji}</Text>
          <Text style={[styles.scoreValue, { color: emojiData.color }]}>
            {score !== null ? `Puntuación: ${score}` : 'Sin evaluar'}
          </Text>
          <Text style={styles.scoreLabel}>{emojiData.label}</Text>
        </View>
        
        {score !== null && (
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreBarFill,
                { 
                  width: `${Math.min(100, (score / 20) * 100)}%`,
                  backgroundColor: emojiData.color
                }
              ]} 
            />
          </View>
        )}
      </View>
    );
  };
  
  // Renderizar gráfico de barras semanal
  const renderWeeklyChart = () => {
    const maxHeight = 100;
    
    return (
      <View style={styles.weeklyChart}>
        <Text style={styles.chartTitle}>Actividad Semanal</Text>
        <View style={styles.chartContainer}>
          {stats.weeklyData.map((day, index) => {
            const percentage = day.total > 0 ? (day.completed / day.total) : 0;
            const isToday = index === stats.weeklyData.length - 1;
            
            return (
              <View key={index} style={styles.chartColumn}>
                <View style={styles.chartBarContainer}>
                  <Animated.View 
                    style={[
                      styles.chartBar,
                      {
                        height: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, maxHeight * percentage]
                        }),
                        backgroundColor: isToday ? theme.colors.accent : theme.colors.primary
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };
  
  // Renderizar tarjeta de estadística mejorada
  const renderStatCard = (
    icon: JSX.Element, 
    title: string, 
    value: number | string, 
    subtitle: string, 
    color: string = theme.colors.primary
  ) => {
    return (
      <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          {React.cloneElement(icon, { color })}
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analizando tu progreso...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color={theme.colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header con resumen */}
          <View style={styles.headerBackground}>
            <View style={styles.headerPattern} />
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.multiply(slideAnim, -1) }]
                }
              ]}
            >
              <View style={styles.mainProgressCard}>
                <Text style={styles.progressTitle}>Tu Progreso General</Text>
                <View style={styles.progressCircleContainer}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressPercentage}>
                      {Math.round(stats.avgCompletionRate * 100)}%
                    </Text>
                    <Text style={styles.progressLabel}>Completado</Text>
                  </View>
                </View>
                
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Icon name="calendar" size={20} color={theme.colors.white} />
                    <Text style={styles.summaryValue}>{stats.totalDaysTracked}</Text>
                    <Text style={styles.summaryLabel}>Días activo</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Icon name="flame" size={20} color={theme.colors.white} />
                    <Text style={styles.summaryValue}>{stats.currentStreak}</Text>
                    <Text style={styles.summaryLabel}>Racha actual</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
          
          {/* Gráfico de puntuaciones con emojis */}
          <Animated.View 
            style={[
              styles.scoresSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Estado de Salud Digestiva</Text>
            <View style={styles.scoresContainer}>
              {renderScoreCard(
                "GERD-Q",
                stats.gerdqScore,
                getGerdqEmoji,
                <MaterialCommunityIcons name="stomach" size={24} color={theme.colors.primary} />
              )}
              {renderScoreCard(
                "RSI",
                stats.rsiScore,
                getRsiEmoji,
                <FontAwesome5 name="head-side-cough" size={22} color={theme.colors.primary} />
              )}
            </View>
          </Animated.View>
          
          {/* Gráfico semanal */}
          <Animated.View 
            style={[
              styles.weeklySection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {renderWeeklyChart()}
          </Animated.View>
          
          {/* Estadísticas detalladas */}
          <Animated.View 
            style={[
              styles.statsGrid,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Métricas Detalladas</Text>
            
            <View style={styles.statsRow}>
              {renderStatCard(
                <Icon name="checkmark-circle" size={28} />,
                "Hábitos completados",
                stats.completedHabits.toString(),
                "registros totales",
                theme.colors.success.main
              )}
              
              {renderStatCard(
                <MaterialCommunityIcons name="trophy" size={28} />,
                "Mejor racha",
                stats.longestStreak.toString(),
                "días consecutivos",
                theme.colors.accent
              )}
            </View>
          </Animated.View>
          
          {/* Mejor hábito */}
          {stats.topHabit.name && (
            <Animated.View 
              style={[
                styles.topHabitSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.topHabitCard}>
                <View style={styles.topHabitHeader}>
                  <MaterialCommunityIcons name="star-circle" size={32} color={theme.colors.accent} />
                  <Text style={styles.topHabitTitle}>Tu Mejor Hábito</Text>
                </View>
                
                <Text style={styles.topHabitName}>{stats.topHabit.name}</Text>
                
                <View style={styles.topHabitStats}>
                  <View style={styles.topHabitStat}>
                    <Icon name="flame" size={20} color={theme.colors.accent} />
                    <Text style={styles.topHabitStatText}>
                      {stats.topHabit.streak} días de racha
                    </Text>
                  </View>
                  <View style={styles.topHabitStat}>
                    <Icon name="trending-up" size={20} color={theme.colors.success.main} />
                    <Text style={styles.topHabitStatText}>
                      {Math.round(stats.topHabit.completionRate * 100)}% completado
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
          
          {/* Motivación */}
          <View style={styles.motivationSection}>
            <View style={styles.motivationCard}>
              <Icon name="bulb-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.motivationTitle}>¡Sigue así!</Text>
              <Text style={styles.motivationText}>
                {stats.currentStreak > 0 
                  ? `Llevas ${stats.currentStreak} días cuidando tu salud digestiva. ¡Cada día cuenta!`
                  : 'Registra tus hábitos diariamente para ver tu progreso aquí.'}
              </Text>
            </View>
          </View>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
      
      <TabNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  
  // Header con patrón (más compacto)
  headerBackground: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 30, // Reducido de 40 a 30
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.secondary,
    opacity: 0.1,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  
  // Tarjeta de progreso principal (MUCHO más compacta)
  mainProgressCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md, // Reducido de xl a md
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  progressTitle: {
    fontSize: theme.fontSize.base, // Reducido de xl a base
    fontWeight: '600', // Reducido de bold a 600
    color: theme.colors.white,
    marginBottom: theme.spacing.sm, // Reducido de lg a sm
  },
  progressCircleContainer: {
    marginBottom: theme.spacing.sm, // Reducido de lg a sm
  },
  progressCircle: {
    width: 80, // Reducido de 120 a 80
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  progressPercentage: {
    fontSize: theme.fontSize.xl, // Reducido de xxxl a xl
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: theme.fontSize.xs, // Reducido de sm a xs
    color: theme.colors.text.secondary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.fontSize.lg, // Reducido de xxl a lg
    fontWeight: 'bold',
    color: theme.colors.white,
    marginVertical: 2, // Reducido de xs
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs, // Reducido de sm a xs
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryDivider: {
    width: 1,
    height: 30, // Reducido de 40 a 30
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Sección de puntuaciones
  scoresSection: {
    padding: theme.spacing.md,
    marginTop: -10, // Cambiado de -20 a -10 para más separación
    paddingTop: theme.spacing.lg, // Añadido padding superior
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scoreTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  scoreContent: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  scoreLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  scoreBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  
  // Gráfico semanal
  weeklySection: {
    padding: theme.spacing.md,
  },
  weeklyChart: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  chartTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    width: '60%',
    height: 100,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  chartLabel: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  chartLabelToday: {
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  
  // Grid de estadísticas
  statsGrid: {
    padding: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  
  // Mejor hábito
  topHabitSection: {
    padding: theme.spacing.md,
  },
  topHabitCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    ...theme.shadows.md,
  },
  topHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  topHabitTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  topHabitName: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  topHabitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  topHabitStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topHabitStatText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  
  // Motivación
  motivationSection: {
    padding: theme.spacing.md,
  },
  motivationCard: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  motivationText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  bottomSpacer: {
    height: 20,
  },
});