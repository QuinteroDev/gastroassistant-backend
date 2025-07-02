import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MainHeaderComponent from '../components/MainHeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '../constants/theme';
import api from '../utils/api';
import { getData } from '../utils/storage';

// Tipos para el contenido del backend
interface ContentCategory {
  id: number;
  name: string;
  icon: string;
  category_type: string;
}

interface ContentData {
  id: number;
  title: string;
  content: string;
  summary: string;
  category: ContentCategory;
  estimated_read_time: number;
  created_at: string;
  unlock_info?: string;
}

interface UserContentAccess {
  id: number;
  content_data: ContentData;
  content_type: 'static' | 'unlocked';
  unlocked_at: string;
  is_read: boolean;
  read_percentage: number;
  read_count: number;
}

interface LockedPreview {
  title: string;
  summary: string;
  unlock_requirement: string;
  points_needed: number;
}

interface LearnDashboardData {
  static_content: UserContentAccess[];
  unlocked_content: UserContentAccess[];
  locked_preview: LockedPreview[];
  newly_unlocked_count: number;
  stats: {
    total_available: number;
    total_read: number;
    total_static: number;
    total_unlocked: number;
  };
}

const { width } = Dimensions.get('window');
// Función para parsear texto con markdown básico (negrita)
const parseMarkdownText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Texto en negrita
      const boldText = part.slice(2, -2);
      return (
        <Text key={index} style={styles.boldText}>
          {boldText}
        </Text>
      );
    }
    return part;
  });
};

const ITEMS_PER_PAGE = 6; // Configuración de paginación
const getCategoryIcon = (categoryType: string) => {
  const iconProps = { size: 20, color: "#fff" };
  
  switch (categoryType) {
    case 'BASIC':
      return <MaterialIcons name="article" {...iconProps} />;
    case 'NUTRITION':
      return <MaterialCommunityIcons name="food-apple" {...iconProps} />;
    case 'EXERCISE':
      return <FontAwesome5 name="running" {...iconProps} />;
    case 'STRESS':
      return <MaterialIcons name="sentiment-neutral" {...iconProps} />;
    case 'MEDICAL':
      return <MaterialCommunityIcons name="test-tube" {...iconProps} />;
    case 'ADVANCED':
      return <MaterialIcons name="school" {...iconProps} />;
    default:
      return <MaterialIcons name="article" {...iconProps} />;
  }
};

// Función para obtener el color según la categoría
const getCategoryColor = (categoryType: string) => {
  switch (categoryType) {
    case 'BASIC':
      return theme.colors.primary;
    case 'NUTRITION':
      return '#16a34a';
    case 'EXERCISE':
      return '#dc2626';
    case 'STRESS':
      return '#7c3aed';
    case 'MEDICAL':
      return '#0891b2';
    case 'ADVANCED':
      return '#ea580c';
    default:
      return theme.colors.primary;
  }
};

export default function EducationalContentScreen() {
  const navigation = useNavigation();
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'general' | 'unlocked'>('general');
  const [learnData, setLearnData] = useState<LearnDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentPageUnlocked, setCurrentPageUnlocked] = useState<number>(1);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Cargar datos del backend
  useEffect(() => {
    loadLearnData();
  }, []);
  
  useEffect(() => {
    if (learnData) {
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
      
      // Animar progreso
      const stats = getStats();
      Animated.timing(progressAnim, {
        toValue: stats.readPercentage / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [learnData]);
  
  // Cargar datos del dashboard de learn
  const loadLearnData = async () => {
    const token = await getData('authToken');
    if (!token) {
      console.log("No hay token, redirigiendo a Login...");
      return;
    }
    
    try {
      console.log('📚 Cargando contenido educativo...');
      const response = await api.get('/api/learn/dashboard/');
      setLearnData(response.data);
      console.log('✅ Contenido cargado:', response.data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error cargando contenido:', err);
      if (err.response) {
        setError(`Error del servidor: ${err.response.status}`);
      } else {
        setError('Error de conexión. Verifica tu internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Marcar artículo como leído en el backend
  const markAsRead = async (contentAccessId: number) => {
    setMarkingAsRead(contentAccessId);
    
    // Animación del botón
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      console.log('📖 Marcando como leído:', contentAccessId);
      await api.post(`/api/learn/read/${contentAccessId}/`, {
        reading_percentage: 100
      });
      
      // Recargar datos para actualizar estado
      await loadLearnData();
      console.log('✅ Marcado como leído');
      
    } catch (err: any) {
      console.error('❌ Error marcando como leído:', err);
      Alert.alert('Error', 'No se pudo marcar el artículo como leído');
    }
    
    setTimeout(() => {
      setMarkingAsRead(null);
    }, 500);
  };
  
  // Función para alternar expandir/colapsar artículo
  const toggleArticle = (id: number) => {
    if (expandedArticle === id) {
      setExpandedArticle(null);
    } else {
      setExpandedArticle(id);
    }
  };
  
  // Obtener estadísticas del backend
  const getStats = () => {
    if (!learnData) return { totalArticles: 0, readCount: 0, readPercentage: 0 };
    
    const { stats } = learnData;
    const readPercentage = stats.total_available > 0 ? (stats.total_read / stats.total_available) * 100 : 0;
    
    return {
      totalArticles: stats.total_available,
      readCount: stats.total_read,
      readPercentage
    };
  };
  
  const stats = getStats();
  
  // Función para obtener contenido paginado
  const getPaginatedContent = (content: UserContentAccess[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return content.slice(startIndex, endIndex);
  };
  
  // Función para obtener total de páginas
  const getTotalPages = (contentLength: number) => {
    return Math.ceil(contentLength / ITEMS_PER_PAGE);
  };
  
  // Renderizar componente de paginación
  const renderPagination = (currentPageState: number, setCurrentPageState: (page: number) => void, totalItems: number) => {
    const totalPages = getTotalPages(totalItems);
    
    if (totalPages <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPageState === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPageState(Math.max(1, currentPageState - 1))}
          disabled={currentPageState === 1}
        >
          <Icon name="chevron-back" size={16} color={currentPageState === 1 ? "#ccc" : theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Página {currentPageState} de {totalPages}
          </Text>
          <Text style={styles.paginationSubtext}>
            {totalItems} artículos totales
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.paginationButton, currentPageState === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPageState(Math.min(totalPages, currentPageState + 1))}
          disabled={currentPageState === totalPages}
        >
          <Icon name="chevron-forward" size={16} color={currentPageState === totalPages ? "#ccc" : theme.colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Función principal para renderizar un artículo
  const renderArticle = (access: UserContentAccess) => {
    const content = access.content_data;
    const isExpanded = expandedArticle === access.id;
    const isRead = access.is_read;
    const isMarkingThis = markingAsRead === access.id;
    const categoryColor = getCategoryColor(content.category.category_type);
    
    return (
      <Animated.View
        key={access.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.articleCard,
            isExpanded && styles.expandedArticleCard,
            isRead && styles.readArticleCard
          ]}
          onPress={() => toggleArticle(access.id)}
          activeOpacity={0.9}
        >
          {/* Decoración lateral para artículos leídos */}
          {isRead && <View style={styles.readIndicator} />}
          
          <View style={styles.articleHeader}>
            <View style={[styles.articleIconContainer, { backgroundColor: categoryColor }]}>
              {getCategoryIcon(content.category.category_type)}
            </View>
            <View style={styles.articleInfoContainer}>
              <View style={styles.articleTitleRow}>
                <Text style={[styles.articleTitle, isRead && styles.readTitle]} numberOfLines={isExpanded ? undefined : 2}>
                  {content.title}
                </Text>
                {isRead && (
                  <View style={styles.readBadge}>
                    <Icon name="checkmark-circle" size={18} color={theme.colors.success.main} />
                  </View>
                )}
              </View>
              
              <View style={styles.articleMetaRow}>
                {content.estimated_read_time && (
                  <View style={styles.readTimeContainer}>
                    <Icon name="time-outline" size={12} color="#999" />
                    <Text style={styles.readTimeText}>{content.estimated_read_time} min</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.expandIcon}>
              <Icon 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#999" 
              />
            </View>
          </View>
          
          {isExpanded && (
            <Animated.View style={[styles.articleContent, { opacity: fadeAnim }]}>
              <Text style={styles.contentText}>
                {parseMarkdownText(content.content)}
              </Text>
              
              {/* Botón de marcar como leído */}
              {!isRead && (
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.markAsReadButton,
                      isMarkingThis && styles.markAsReadButtonActive
                    ]}
                    onPress={() => markAsRead(access.id)}
                    disabled={isMarkingThis}
                  >
                    {isMarkingThis ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.markAsReadButtonText}>Marcando...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.markAsReadButtonText}>Marcar como leído</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              )}
              
              {/* Indicador si ya está leído */}
              {isRead && (
                <View style={styles.alreadyReadContainer}>
                  <Icon name="checkmark-circle" size={18} color={theme.colors.success.main} />
                  <Text style={styles.alreadyReadText}>Artículo completado</Text>
                  {access.read_count > 1 && (
                    <Text style={styles.readCountText}>• Leído {access.read_count} veces</Text>
                  )}
                </View>
              )}
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Renderizar contenido bloqueado
  const renderLockedContent = (locked: LockedPreview, index: number) => {
    return (
      <Animated.View
        key={`locked-${index}`}
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={[styles.articleCard, styles.lockedCard]}>
          <View style={styles.lockedOverlay}>
            <Icon name="lock-closed" size={16} color="#999" />
          </View>
          
          <View style={styles.articleHeader}>
            <View style={styles.lockedIconContainer}>
              <Icon name="lock-closed" size={20} color="#999" />
            </View>
            <View style={styles.articleInfoContainer}>
              <Text style={styles.lockedTitle} numberOfLines={2}>
                {locked.title}
              </Text>
              <View style={styles.unlockBadge}>
                <Icon name="star-outline" size={12} color="#f59e0b" />
                <Text style={styles.unlockRequirement}>
                  {locked.unlock_requirement}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.lockedSummary} numberOfLines={3}>
            {locked.summary}
          </Text>
        </View>
      </Animated.View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <MainHeaderComponent />
        <View style={styles.centerContent}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando contenido...</Text>
          </View>
        </View>
        <TabNavigationBar />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <MainHeaderComponent />
        <View style={styles.centerContent}>
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={48} color={theme.colors.error.main} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true);
                setError(null);
                loadLearnData();
              }}
            >
              <Icon name="refresh" size={16} color="#fff" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TabNavigationBar />
      </View>
    );
  }
  
  if (!learnData) {
    return (
      <View style={styles.container}>
        <MainHeaderComponent />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No hay contenido disponible</Text>
        </View>
        <TabNavigationBar />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header estilo Stats mejorado - SOLO mostrar en sección general */}
        {activeSection === 'general' && (
          <View style={styles.headerBackground}>
            <View style={styles.headerPattern} />
            <View style={styles.headerDecorations}>
              <View style={styles.bookDecoration1}>
                <Text style={styles.decorationEmoji}>📚</Text>
              </View>
              <View style={styles.bookDecoration2}>
                <Text style={styles.decorationEmoji}>💡</Text>
              </View>
            </View>
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.mainProgressCard}>
                <View style={styles.progressHeader}>
                  <MaterialCommunityIcons name="book-open-variant" size={28} color={theme.colors.white} />
                  <Text style={styles.progressTitle}>Tu Progreso de Aprendizaje</Text>
                </View>
                
                <View style={styles.progressCircleContainer}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressPercentage}>
                      {Math.round(stats.readPercentage)}%
                    </Text>
                    <Text style={styles.progressLabel}>Completado</Text>
                  </View>
                </View>
                
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Icon name="book" size={20} color={theme.colors.white} />
                    <Text style={styles.summaryValue}>{stats.readCount}</Text>
                    <Text style={styles.summaryLabel}>Leídos</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Icon name="library" size={20} color={theme.colors.white} />
                    <Text style={styles.summaryValue}>{stats.totalArticles}</Text>
                    <Text style={styles.summaryLabel}>Disponibles</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        )}
        
        {/* Menú de secciones mejorado */}
        <Animated.View 
          style={[
            styles.sectionMenuContainer,
            activeSection === 'unlocked' && styles.sectionMenuContainerUnlocked,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionMenu}>
            <TouchableOpacity
              style={[
                styles.sectionButton,
                activeSection === 'general' && styles.activeSectionButton
              ]}
              onPress={() => {
                setActiveSection('general');
                setCurrentPage(1);
              }}
            >
              <Icon 
                name="library-outline" 
                size={18} 
                color={activeSection === 'general' ? '#ffffff' : '#999'} 
              />
              <Text style={[
                styles.sectionButtonText,
                activeSection === 'general' && styles.activeSectionButtonText
              ]}>
                General
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sectionButton,
                activeSection === 'unlocked' && styles.activeSectionButton
              ]}
              onPress={() => {
                setActiveSection('unlocked');
                setCurrentPageUnlocked(1);
              }}
            >
              <Icon 
                name="trophy-outline" 
                size={18} 
                color={activeSection === 'unlocked' ? '#ffffff' : '#999'} 
              />
              <Text style={[
                styles.sectionButtonText,
                activeSection === 'unlocked' && styles.activeSectionButtonText
              ]}>
                Desbloqueables
              </Text>
              {learnData.unlocked_content.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{learnData.unlocked_content.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Contenido según sección activa */}
        <View style={styles.contentContainer}>
          {activeSection === 'general' && (
            <>
              {/* Contenido General con paginación */}
              {getPaginatedContent(learnData.static_content, currentPage).map((access) => renderArticle(access))}
              
              {/* Paginación para contenido general */}
              {renderPagination(currentPage, setCurrentPage, learnData.static_content.length)}
              
              {/* Call to action mejorado */}
              <View style={styles.ctaContainer}>
                <View style={styles.ctaIconContainer}>
                  <Icon name="bulb-outline" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.ctaText}>
                  Conocimiento en constante evolución
                </Text>
                <Text style={styles.ctaSubtext}>
                  Actualizamos periódicamente el contenido con las últimas investigaciones en salud digestiva
                </Text>
              </View>
            </>
          )}
          
          {activeSection === 'unlocked' && (
            <>
              {/* Contenido Desbloqueado con paginación */}
              {learnData.unlocked_content.length > 0 ? (
                <>
                  {getPaginatedContent(learnData.unlocked_content, currentPageUnlocked).map((access) => renderArticle(access))}
                  
                  {/* Paginación para contenido desbloqueado */}
                  {renderPagination(currentPageUnlocked, setCurrentPageUnlocked, learnData.unlocked_content.length)}
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Icon name="trophy-outline" size={48} color="#e5e7eb" />
                  </View>
                  <Text style={styles.emptyText}>Aún no has desbloqueado contenido</Text>
                  <Text style={styles.emptySubtext}>
                    Completa hábitos para ganar medallas y desbloquear artículos exclusivos
                  </Text>
                </View>
              )}
              
              {/* Contenido Bloqueado */}
              {learnData.locked_preview.length > 0 ? (
                <>
                  <View style={styles.lockedSectionHeader}>
                    <Icon name="lock-closed-outline" size={20} color="#999" />
                    <Text style={styles.lockedSectionTitle}>Próximo a Desbloquear</Text>
                  </View>
                  
                  {learnData.locked_preview.map((locked, index) => renderLockedContent(locked, index))}
                </>
              ) : (
                <View style={styles.ctaContainer}>
                  <View style={styles.ctaIconContainer}>
                    <Icon name="rocket-outline" size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.ctaText}>
                    ¡Más contenido en camino!
                  </Text>
                  <Text style={styles.ctaSubtext}>
                    En los próximos ciclos desbloquearás contenido exclusivo según tu progreso
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Barra de navegación */}
      <TabNavigationBar />
    </View>
  );
}

// Estilos embellecidos pero profesionales
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
    backgroundColor: '#f8fafc',
  },
  
  // Loading y Error states
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.error.main,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  
  // Header embellecido pero profesional
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
    opacity: 0.08,
  },
  headerDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  bookDecoration1: {
    position: 'absolute',
    top: 20,
    right: 20,
    opacity: 0.15,
    transform: [{ rotate: '15deg' }],
  },
  bookDecoration2: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    opacity: 0.12,
    transform: [{ rotate: '-10deg' }],
  },
  decorationEmoji: {
    fontSize: 20,
    color: theme.colors.white,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  
  // Tarjeta de progreso mejorada
  mainProgressCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  progressCircleContainer: {
    marginBottom: theme.spacing.md,
  },
  progressCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressPercentage: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: '500',
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
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Menú de secciones premium
  sectionMenuContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    marginTop: -15,
  },
  sectionMenuContainerUnlocked: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionMenu: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: 6,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    position: 'relative',
  },
  activeSectionButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  sectionButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  activeSectionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Paginación
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    marginVertical: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  paginationSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  
  // Contenido
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  // Tarjetas de artículo premium
  articleCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...theme.shadows.md,
    position: 'relative',
    overflow: 'hidden',
  },
  expandedArticleCard: {
    borderColor: theme.colors.primary + '30',
    ...theme.shadows.lg,
    transform: [{ scale: 1.01 }],
  },
  readArticleCard: {
    backgroundColor: '#f8fdf8',
    borderColor: '#d1fae5',
  },
  readIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.success.main,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  lockedCard: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e5e5',
    position: 'relative',
  },
  lockedOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  articleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  lockedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  articleInfoContainer: {
    flex: 1,
  },
  articleTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  articleTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginRight: theme.spacing.sm,
  },
  readTitle: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  readBadge: {
    marginTop: 2,
  },
  lockedTitle: {
    color: '#999',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  
  articleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: theme.fontSize.xs,
    color: '#999',
    marginLeft: 2,
    fontWeight: '500',
  },
  unlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockRequirement: {
    fontSize: theme.fontSize.xs,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  expandIcon: {
    padding: theme.spacing.xs,
  },
  
  // Contenido del artículo
  articleContent: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  contentText: {
    fontSize: theme.fontSize.base,
    lineHeight: 26,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    fontWeight: '400',
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  lockedSummary: {
    fontSize: theme.fontSize.sm,
    color: '#999',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  
  // Botón de marcar como leído premium
  markAsReadButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  markAsReadButtonActive: {
    backgroundColor: theme.colors.success.main,
  },
  markAsReadButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
  
  // Indicador de ya leído premium
  alreadyReadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: '#f0fdf4',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  alreadyReadText: {
    color: theme.colors.success.main,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
  readCountText: {
    color: theme.colors.success.main,
    fontSize: theme.fontSize.xs,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  
  // Empty state premium
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: '#475569',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
    fontWeight: '500',
  },
  
  // Sección de contenido bloqueado premium
  lockedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  lockedSectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '700',
    color: '#475569',
    marginLeft: theme.spacing.sm,
  },
  
  // Call to action premium
  ctaContainer: {
    backgroundColor: '#f8faff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    ...theme.shadows.md,
  },
  ctaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  ctaText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  ctaSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
    fontWeight: '500',
  },
});