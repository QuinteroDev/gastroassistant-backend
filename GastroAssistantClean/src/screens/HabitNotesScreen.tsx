import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MainHeaderComponent from '../components/MainHeaderComponent';
import api from '../utils/api';
import { theme } from '../constants/theme';

// Tipos
interface Note {
  id: number;
  date: string;
  notes: string;
  all_habits_completed: boolean;
}

interface MonthlyNotes {
  month: string;
  month_key: string;
  notes: Note[];
}

type RootStackParamList = {
  HabitNotes: undefined;
  Stats: undefined;
};

type HabitNotesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitNotes'>;

const { width } = Dimensions.get('window');

// Función para formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('es-ES', options);
};

// Función para obtener emoji del día
const getDayEmoji = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDay();
  const emojis = ['🌙', '💪', '🌟', '🚀', '✨', '🎯', '🌈'];
  return emojis[day];
};

// Función para formatear nombre del mes en español
const formatMonthName = (dateString: string) => {
  const date = new Date(dateString + '-01');
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    year: 'numeric' 
  };
  const monthYear = date.toLocaleDateString('es-ES', options);
  // Capitalizar primera letra
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
};

export default function HabitNotesScreen() {
  const navigation = useNavigation<HabitNotesNavigationProp>();
  const [monthlyNotes, setMonthlyNotes] = useState<MonthlyNotes[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Cargar notas
  const loadNotes = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/habits/daily-notes/monthly/');
      console.log('Notas mensuales:', response.data);
      
      setMonthlyNotes(response.data);
      
      // Expandir el mes actual por defecto
      if (response.data.length > 0 && expandedMonths.length === 0) {
        setExpandedMonths([response.data[0].month_key]);
      }
      
      // Animaciones
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
      ]).start();
      
    } catch (err) {
      console.error('Error cargando notas:', err);
      setError('No se pudieron cargar las notas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadNotes();
  }, []);
  
  // Función para refrescar
  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotes(false);
  };
  
  // Alternar mes expandido
  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      if (prev.includes(monthKey)) {
        return prev.filter(key => key !== monthKey);
      } else {
        return [...prev, monthKey];
      }
    });
  };
  
  // Renderizar una nota individual
  const renderNote = (note: Note, index: number) => {
    const isLastNote = index === monthlyNotes[0]?.notes.length - 1;
    
    return (
      <Animated.View
        key={note.id}
        style={[
          styles.noteCard,
          isLastNote && styles.lastNoteCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 20]
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteDateContainer}>
            <Text style={styles.noteDayEmoji}>{getDayEmoji(note.date)}</Text>
            <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
          </View>
        </View>
        
        <View style={styles.noteContent}>
          <Text style={styles.noteText}>{note.notes}</Text>
        </View>
      </Animated.View>
    );
  };
  
  // Renderizar un mes
  const renderMonth = (monthData: MonthlyNotes) => {
    const isExpanded = expandedMonths.includes(monthData.month_key);
    const noteCount = monthData.notes.length;
    const monthName = formatMonthName(monthData.month_key);
    
    return (
      <Animated.View
        key={monthData.month_key}
        style={[
          styles.monthContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.monthHeader}
          onPress={() => toggleMonth(monthData.month_key)}
          activeOpacity={0.8}
        >
          <View style={styles.monthTitleContainer}>
            <View style={styles.monthIconContainer}>
              <Icon name="calendar" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.monthTitle}>{monthName}</Text>
            <View style={styles.noteCountBadge}>
              <Text style={styles.noteCountText}>{noteCount}</Text>
            </View>
          </View>
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.monthContent}>
            {monthData.notes.map((note, index) => renderNote(note, index))}
          </View>
        )}
      </Animated.View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <MainHeaderComponent showBackButton={true} />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tus notas...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent showBackButton={true} />
      
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={theme.colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadNotes()}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : monthlyNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="book-outline" size={64} color={theme.colors.text.light} />
          </View>
          <Text style={styles.emptyTitle}>No hay notas todavía</Text>
          <Text style={styles.emptyText}>
            Cuando completes todos tus hábitos del día, podrás añadir una nota de reflexión aquí
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Estadísticas rápidas */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="document-text" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>
                {monthlyNotes.reduce((total, month) => total + month.notes.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Notas totales</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="calendar-outline" size={24} color={theme.colors.accent} />
              <Text style={styles.statValue}>{monthlyNotes.length}</Text>
              <Text style={styles.statLabel}>Meses registrados</Text>
            </View>
          </View>
          
          {/* Lista de meses con notas */}
          <View style={styles.monthsList}>
            {monthlyNotes.map(renderMonth)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.lg,
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
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Contenido
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  
  // Estadísticas
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  // Lista de meses
  monthsList: {
    padding: theme.spacing.md,
  },
  monthContainer: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  monthIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  monthTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textTransform: 'capitalize',
  },
  noteCountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  noteCountText: {
    color: "#fff",
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  monthContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  
  // Notas individuales
  noteCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  lastNoteCard: {
    marginBottom: 0,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  noteDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDayEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  noteDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  noteContent: {
    marginTop: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
});