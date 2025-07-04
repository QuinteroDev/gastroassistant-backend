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
  Dimensions,
  Image
} from 'react-native';
import MainHeaderComponent from '../components/MainHeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Mapeo de títulos de hábitos - ACTUALIZADO
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
  weeklyData: Array<{
    day: string;
    completed: number;
    total: number;
  }>;
}

interface GamificationData {
  level: string;
  current_points: number;
  current_streak: number;
  longest_streak: number;
  progress: {
    current_points: number;
    next_level_points: number | null;
    progress_percentage: number;
  };
  cycle_number: number | null;
  medals_this_cycle: Array<{
    id: number;
    medal: {
      id: number;
      name: string;
      description: string;
      icon: string;
      required_points: number;
      required_level: string;
      required_cycle_number: number;
    };
    earned_at: string;
  }>;
}

interface Medal {
  id: number;
  name: string;
  description: string;
  icon: string;
  required_points: number;
  required_level: string;
  required_cycle_number: number;
  is_earned?: boolean;
}

const { width } = Dimensions.get('window');

// Función para obtener imagen e info del nivel - ACTUALIZADA
const getLevelInfo = (level: string) => {
  const levelMap: { [key: string]: { image: any; color: string; name: string } } = {
    'NOVATO': { 
      image: require('../assets/images/levels/novato.png'), 
      color: theme.colors.primary, // Azul de Gastro Assistant
      name: 'Novato' 
    },
    'BRONCE': { 
      image: require('../assets/images/levels/bronce.png'), 
      color: theme.colors.primary, // Azul de Gastro Assistant
      name: 'Bronce' 
    },
    'PLATA': { 
      image: require('../assets/images/levels/plata.png'), 
      color: theme.colors.primary, // Azul de Gastro Assistant
      name: 'Plata' 
    },
    'ORO': { 
      image: require('../assets/images/levels/oro.png'), 
      color: theme.colors.primary, // Azul de Gastro Assistant
      name: 'Oro' 
    },
    'PLATINO': { 
      image: require('../assets/images/levels/platino.png'), 
      color: theme.colors.primary, // Azul de Gastro Assistant
      name: 'Platino' 
    },
    'MAESTRO': { 
      image: require('../assets/images/levels/maestro.png'), 
      color: theme.colors.primary, // Azul de Gastro Assistant
      name: 'Maestro' 
    }
  };
  
  return levelMap[level] || { image: null, color: theme.colors.primary, name: 'Desconocido' };
};

// Función para obtener imagen de medalla - ACTUALIZADA (sin testing)
const getMedalImage = (medalName: string) => {
  const medalImages: { [key: string]: any } = {
    // Solo medallas por ciclo con los nombres actualizados
    'Maestro de Hábitos': require('../assets/images/medals/mes1.png'),
    'Guardián Nutricional': require('../assets/images/medals/mes2.png'),
    'Campeón del Movimiento': require('../assets/images/medals/mes3.png'),
    'Domador del Estrés': require('../assets/images/medals/mes4.png'),
    'Campeón del Descanso': require('../assets/images/medals/mes5.png'),
    'Maestro Digestivo Supremo': require('../assets/images/medals/mes6.png'),
  };
  
  return medalImages[medalName] || null;
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
    weeklyData: []
  });
  
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [allMedals, setAllMedals] = useState<Medal[]>([]);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Cargar datos reales del backend
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Cargar datos de gamificación
        const gamificationResponse = await api.get('/api/gamification/dashboard/');
        console.log('Gamification response:', gamificationResponse.data);
        setGamificationData(gamificationResponse.data);
        
        // Cargar todas las medallas disponibles
        const medalsResponse = await api.get('/api/gamification/all-medals/');
        console.log('Medals response:', medalsResponse.data);
        
        // Las medallas ya vienen con is_earned desde el backend
        setAllMedals(medalsResponse.data.medals);
        
        // Obtener datos de hábitos (mantener lógica existente)
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
          const dayName = WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
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
                
                // 🆕 USAR TÍTULO ACTUALIZADO DEL MAPEO
                const habitTitle = HABIT_TITLES[habit.habit.habit_type] || habit.habit.text;
                
                // Encontrar el mejor hábito
                if (habit.streak.current_streak > topHabitData.streak || 
                    (habit.streak.current_streak === topHabitData.streak && habitCompletionRate > topHabitData.completionRate)) {
                  topHabitData = {
                    name: habitTitle, // 🆕 USAR TÍTULO ACTUALIZADO
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
  
  // Renderizar tarjeta de nivel del usuario
  const renderLevelCard = () => {
    if (!gamificationData) return null;
    
    const levelInfo = getLevelInfo(gamificationData.level);
    
    return (
      <Animated.View 
        style={[
          styles.levelCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Decoraciones de fondo para nivel */}
        <View style={styles.levelDecorations}>
          <View style={styles.levelDecoration1}>
            <Text style={styles.levelDecoEmoji}>🎯</Text>
          </View>
          <View style={styles.levelDecoration2}>
            <Text style={styles.levelDecoEmoji}>⚡</Text>
          </View>
        </View>
        
        <View style={styles.levelHeader}>
          <MaterialCommunityIcons name="trophy" size={28} color={theme.colors.primary} />
          <Text style={styles.levelTitle}>Tu Nivel Actual</Text>
        </View>
        
        <View style={styles.levelContent}>
          {levelInfo.image ? (
            <Image 
              source={levelInfo.image} 
              style={styles.levelImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.levelEmoji}>🟤</Text>
          )}
          <Text style={[styles.levelName, { color: theme.colors.primary }]}>
            {levelInfo.name}
          </Text>
          
          {gamificationData.progress.next_level_points && (
            <>
              <Text style={styles.progressLabel}>
                Progreso hacia el siguiente nivel
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${gamificationData.progress.progress_percentage}%`,
                        backgroundColor: theme.colors.primary // Siempre azul de Gastro Assistant
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(gamificationData.progress.progress_percentage)}%
                </Text>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    );
  };
  
  // Renderizar grid de medallas - ACTUALIZADO
  const renderMedalsSection = () => {
    // Filtrar medallas de testing y limitar a 6
    const filteredMedals = allMedals.filter(medal => 
      !medal.name.toLowerCase().includes('testing') && 
      !medal.name.toLowerCase().includes('prueba')
    ).slice(0, 6);
    
    if (filteredMedals.length === 0) return null;
    
    return (
      <View style={styles.medalsSection}>
        <Animated.View 
          style={[
            styles.medalsContainer,
            {
              opacity: fadeAnim,
              transform: [
                { 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 15]
                  })
                },
                { 
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }
              ]
            }
          ]}
        >
          {/* Título embellecido dentro de la tarjeta */}
          <View style={styles.medalsSectionHeader}>
            <MaterialCommunityIcons name="medal" size={28} color={theme.colors.accent} />
            <Text style={styles.medalsSectionTitle}>Medallas</Text>
            <View style={styles.medalsHeaderLine} />
          </View>
          
          {/* Decoración de podio */}
          <View style={styles.podiumDecoration}>
            <View style={styles.podiumStep1} />
            <View style={styles.podiumStep2} />
            <View style={styles.podiumStep3} />
          </View>
          
          {/* Elementos decorativos */}
          <View style={styles.medalDecorations}>
            <View style={styles.starDecoration1}>
              <Text style={styles.starEmoji}>⭐</Text>
            </View>
            <View style={styles.starDecoration2}>
              <Text style={styles.starEmoji}>✨</Text>
            </View>
            <View style={styles.crownDecoration}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
          </View>
          
          <View style={styles.medalsGrid}>
            {filteredMedals.map((medal, index) => {
              const medalImage = getMedalImage(medal.name);
              console.log(`Medalla: "${medal.name}" - Imagen encontrada: ${medalImage ? 'SÍ' : 'NO'}`);
              
              return (
                <Animated.View
                  key={medal.id}
                  style={{
                    opacity: progressAnim,
                    transform: [
                      {
                        translateY: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        })
                      }
                    ]
                  }}
                >
                  <TouchableOpacity 
                    style={[
                      styles.medalCard,
                      medal.is_earned ? styles.medalEarned : styles.medalLocked
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      // Pequeña animación al tocar
                      Animated.sequence([
                        Animated.timing(new Animated.Value(1), {
                          toValue: 0.95,
                          duration: 100,
                          useNativeDriver: true,
                        }),
                        Animated.timing(new Animated.Value(0.95), {
                          toValue: 1,
                          duration: 100,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                  >
                    {medalImage ? (
                      <Image 
                        source={medalImage}
                        style={[
                          styles.medalImage,
                          !medal.is_earned && styles.medalImageLocked
                        ]}
                        resizeMode="contain"
                      />
                    ) : (
                      <>
                        <Text style={[
                          styles.medalIcon,
                          !medal.is_earned && styles.medalIconLocked
                        ]}>
                          {medal.icon}
                        </Text>
                        <Text style={[
                          styles.medalName,
                          !medal.is_earned && styles.medalTextLocked
                        ]}>
                          {medal.name}
                        </Text>
                      </>
                    )}
                    
                    {medal.is_earned && (
                      <View style={styles.medalBadge}>
                        <Icon name="checkmark" size={14} color={theme.colors.white} />
                      </View>
                    )}
                    
                    {medal.is_earned && (
                      <View style={styles.medalGlow} />
                    )}
                    
                    {!medal.is_earned && (
                      <View style={styles.medalRequirementBadge}>
                        <Text style={styles.medalRequirementIcon}>🔒</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
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
          
          {/* Sección de Nivel y Medallas */}
          <Animated.View 
            style={[
              styles.gamificationSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {renderLevelCard()}
            {renderMedalsSection()}
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
  
  // Header con patrón
  headerBackground: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 30,
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
  
  // Tarjeta de progreso principal
  mainProgressCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  progressTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  progressCircleContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  progressPercentage: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: theme.fontSize.xs,
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
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Sección de gamificación
  gamificationSection: {
    padding: theme.spacing.md,
    marginTop: -10,
    paddingTop: theme.spacing.lg,
  },
  
  // Tarjeta de nivel
  levelCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}10`,
  },
  levelDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  levelDecoration1: {
    position: 'absolute',
    top: 15,
    right: 15,
    opacity: 0.1,
    transform: [{ rotate: '15deg' }],
  },
  levelDecoration2: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    opacity: 0.1,
    transform: [{ rotate: '-15deg' }],
  },
  levelDecoEmoji: {
    fontSize: 24,
    color: theme.colors.primary,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}15`,
  },
  levelTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  levelContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  levelEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  levelImage: {
    width: 160, // MÁS GRANDE (era 80)
    height: 160, // MÁS GRANDE (era 80)
    marginBottom: theme.spacing.md,
  },
  levelName: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  
  // Sección de medallas
  medalsSection: {
    marginTop: theme.spacing.md,
  },
  medalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.accent}15`,
    position: 'relative',
  },
  medalsSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.accent,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  medalsHeaderLine: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    width: 40,
    height: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: 1,
  },
  medalsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}10`,
  },
  
  // Decoración de podio
  podiumDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    opacity: 0.1,
  },
  podiumStep1: {
    width: 40,
    height: 25,
    backgroundColor: theme.colors.accent,
    marginHorizontal: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumStep2: {
    width: 40,
    height: 30,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumStep3: {
    width: 40,
    height: 20,
    backgroundColor: '#CD7F32',
    marginHorizontal: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  
  // Decoraciones con iconos
  medalDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  starDecoration1: {
    position: 'absolute',
    top: 15,
    right: 20,
    opacity: 0.2,
    transform: [{ rotate: '15deg' }],
  },
  starDecoration2: {
    position: 'absolute',
    top: 40,
    left: 15,
    opacity: 0.15,
    transform: [{ rotate: '-20deg' }],
  },
  crownDecoration: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -10,
    opacity: 0.1,
    transform: [{ rotate: '5deg' }],
  },
  starEmoji: {
    fontSize: 20,
    color: theme.colors.accent,
  },
  crownEmoji: {
    fontSize: 24,
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  
  // Grid de medallas - ACTUALIZADO
  medalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.xs, // Gap más pequeño para que quepan 3
  },
  medalCard: {
    width: (width - theme.spacing.md * 2 - theme.spacing.lg * 2 - theme.spacing.sm * 4) / 3, // Ancho correcto para 3 por fila
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, // Bordes más redondeados
    padding: theme.spacing.sm, // Padding ajustado
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: theme.spacing.md, // Más espacio vertical
    minHeight: 120, // Más altura (era 90)
    ...theme.shadows.md,
  },
  medalEarned: {
    borderWidth: 3,
    borderColor: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}08`,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  medalLocked: {
    opacity: 0.4,
    transform: [{ scale: 0.95 }],
  },
  medalIcon: {
    fontSize: 32, // Más grande (era 24)
    marginBottom: theme.spacing.sm,
  },
  medalImage: {
    width: 95, // Ajustado para que quepan 3 por fila
    height: 95, // Ajustado para que quepan 3 por fila
    marginBottom: theme.spacing.sm,
  },
  medalImageLocked: {
    opacity: 0.5,
  },
  medalIconLocked: {
    opacity: 0.5,
  },
  medalName: {
    fontSize: theme.fontSize.sm, // Ligeramente más grande (era xs)
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 16, // Más espacio de línea
  },
  medalTextLocked: {
    opacity: 0.7,
  },
  medalBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 26, // Ligeramente más grande
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  medalGlow: {
    position: 'absolute',
    top: -6, // Más glow
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: theme.borderRadius.xl + 6,
    backgroundColor: `${theme.colors.accent}15`,
    zIndex: -1,
  },
  medalRequirementBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22, // Ligeramente más grande
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  medalRequirementIcon: {
    fontSize: 12, // Ligeramente más grande
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