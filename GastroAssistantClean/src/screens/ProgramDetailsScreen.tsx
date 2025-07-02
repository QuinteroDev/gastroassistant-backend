// ProgramDetailsScreen.tsx - Versión final completa y corregida

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainHeaderComponent from '../components/MainHeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import CycleRenewalModal from '../components/CycleRenewalModal';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../utils/api';
import { getData, storeData } from '../utils/storage';
import { theme } from '../constants/theme';
import { useCycleManagement } from '../hooks/useCycleManagement';

// Tipos de navegación
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ProgramDetails: undefined;
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
  OnboardingGerdQ: undefined;
  OnboardingRsi: undefined;
  OnboardingClinicalFactors: undefined;
  OnboardingDiagnosticTests: undefined;
  OnboardingHabits: undefined;
  GeneratingProgram: undefined;
  Tracker: undefined;
  Education: undefined;
  Stats: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  HelpCenter: undefined;
  ProfileUpdate: undefined;
};

type ProgramDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProgramDetails'>;

// Iconos para cada sección del programa
const SECTION_ICONS: { [key: string]: JSX.Element } = {
  'psychology': <MaterialIcons name="psychology" size={24} color="#ffffff" />,
  'alert-circle': <Icon name="alert-circle" size={24} color="#ffffff" />,
  'checkmark-circle': <Icon name="checkmark-circle" size={24} color="#ffffff" />,
  'hospital-user': <FontAwesome5 name="hospital-user" size={22} color="#ffffff" />
};

// Iconos para factores clínicos
const FACTOR_ICONS: { [key: string]: JSX.Element } = {
  'stomach': <FontAwesome5 name="stomach" size={24} color="#ffffff" />,
  'moving': <MaterialIcons name="moving" size={24} color="#ffffff" />,
  'hourglass-outline': <Icon name="hourglass-outline" size={24} color="#ffffff" />,
  'water-outline': <Icon name="water-outline" size={24} color="#ffffff" />,
  'pending-actions': <MaterialIcons name="pending-actions" size={24} color="#ffffff" />,
  'psychology': <MaterialIcons name="psychology" size={24} color="#ffffff" />,
  'monitor-weight': <MaterialIcons name="monitor-weight" size={24} color="#ffffff" />
};

const { width } = Dimensions.get('window');

export default function ProgramDetailsScreen() {
  const navigation = useNavigation<ProgramDetailsNavigationProp>();
  const [userProgram, setUserProgram] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [priorityRecommendations, setPriorityRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  const [showCycleInfoModal, setShowCycleInfoModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  
  // Añadir el hook de ciclos
  const { 
    currentCycle, 
    daysRemaining, 
    daysElapsed,
    needsRenewal,
    loading: cycleLoading,
    error: cycleError,
    startNewCycle
  } = useCycleManagement();
  
  // Animaciones
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  // Verificar si debe mostrar el modal de renovación
  useEffect(() => {
    const checkRenewalStatus = async () => {
      console.log('=== VERIFICANDO RENOVACIÓN ===');
      console.log('needsRenewal:', needsRenewal);
      console.log('cycleLoading:', cycleLoading);
      console.log('currentCycle:', currentCycle);
      
      if (needsRenewal && !cycleLoading && currentCycle) {
        console.log('Condiciones básicas cumplidas');
        console.log('onboarding_completed_at:', currentCycle.onboarding_completed_at);
        
        // Solo mostrar si el ciclo ya completó el onboarding
        if (currentCycle.onboarding_completed_at) {
          console.log('Onboarding completado, verificando recordatorio...');
          
          // Verificar si ya se pospuso el recordatorio hoy
          const reminderKey = `cycle_reminder_${currentCycle.id}_postponed`;
          const postponedDate = await getData(reminderKey);
          const today = new Date().toDateString();
          
          console.log('Reminder key:', reminderKey);
          console.log('Postponed date:', postponedDate);
          console.log('Today:', today);
          
          if (postponedDate !== today) {
            console.log('MOSTRANDO MODAL DE RENOVACIÓN');
            setShowRenewalModal(true);
          } else {
            console.log('Modal pospuesto para hoy');
          }
        } else {
          console.log('Onboarding NO completado');
        }
      } else {
        console.log('Condiciones NO cumplidas');
      }
    };
    
    checkRenewalStatus();
  }, [needsRenewal, cycleLoading, currentCycle]);
  
  // Función para manejar el inicio de renovación
  const handleStartRenewal = () => {
    setShowRenewalModal(false);
    startNewCycle();
  };
  
  // Función para manejar recordar más tarde
  const handleRemindLater = async () => {
    setShowRenewalModal(false);
    
    // Guardar que se pospuso para hoy
    if (currentCycle) {
      const reminderKey = `cycle_reminder_${currentCycle.id}_postponed`;
      const today = new Date().toDateString();
      await storeData(reminderKey, today);
    }
    
    // Programar para mostrar nuevamente en 24 horas
    console.log('Recordatorio pospuesto para mañana');
  };
  
  // Componente modal de información de ciclos - CORREGIDO
  const CycleInfoModal = () => (
    <Modal
      visible={showCycleInfoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCycleInfoModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCycleInfoModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <Icon name="information-circle" size={40} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCycleInfoModal(false)}
            >
              <Icon name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
  
          <Text style={styles.modalTitle}>¿Qué son los ciclos?</Text>
          
          {/* ScrollView mejorado con más altura */}
          <ScrollView 
            style={styles.modalScrollView} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Ciclos de 30 días</Text>
              </View>
              <Text style={styles.modalText}>
                Tu programa se organiza en ciclos de 30 días. Cada ciclo es una oportunidad para mejorar tus hábitos digestivos y evaluar tu progreso.
              </Text>
            </View>
  
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Icon name="refresh-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Evaluación mensual</Text>
              </View>
              <Text style={styles.modalText}>
                Al finalizar cada ciclo, realizarás una nueva evaluación para ajustar tu programa según tu evolución y necesidades actuales.
              </Text>
            </View>
  
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Icon name="trending-up-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Seguimiento de progreso</Text>
              </View>
              <Text style={styles.modalText}>
                Podrás ver cómo has mejorado comparando tus puntuaciones GERDq y RSI entre ciclos, además del progreso en tus hábitos.
              </Text>
            </View>
  
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Icon name="notifications-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Recordatorios</Text>
              </View>
              <Text style={styles.modalText}>
                Cuando queden 3 días o menos para terminar tu ciclo, verás una notificación para prepararte para la siguiente evaluación.
              </Text>
            </View>
  
            {/* Contenido adicional para probar scroll */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Icon name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Beneficios del sistema</Text>
              </View>
              <Text style={styles.modalText}>
                Este sistema de ciclos te permite mantener un seguimiento constante de tu progreso y ajustar tu tratamiento según tus necesidades cambiantes.
              </Text>
            </View>
          </ScrollView>
  
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowCycleInfoModal(false)}
          >
            <Text style={styles.modalButtonText}>Entendido</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
  
  
  // Cargar datos del programa
  useEffect(() => {
    const fetchProgramData = async () => {
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
        // Cargar datos del perfil
        const profileResponse = await api.get('/api/profiles/me/');
        
        if (profileResponse.data) {
          if (profileResponse.data.first_name) {
            setUserName(profileResponse.data.first_name);
          } else if (profileResponse.data.username) {
            setUserName(profileResponse.data.username);
          }
        }
        
        // Cargar el programa asignado (ahora con contenido incluido desde el backend)
        const programResponse = await api.get('/api/programs/my-program/');
        
        if (programResponse.data) {
          console.log("Programa cargado desde backend:", programResponse.data);
          setUserProgram(programResponse.data);
        }
        
        // Cargar recomendaciones prioritarias
        const priorityResponse = await api.get('/api/recommendations/prioritized/');
        
        if (priorityResponse.data) {
          console.log("Recomendaciones prioritarias:", priorityResponse.data);
          setPriorityRecommendations(priorityResponse.data);
        }
        
        // Cargar todas las recomendaciones
        const allRecommendationsResponse = await api.get('/api/recommendations/');
        
        if (allRecommendationsResponse.data) {
          console.log("Todas las recomendaciones:", allRecommendationsResponse.data);
          setRecommendations(allRecommendationsResponse.data);
        }
        
        // Iniciar animación
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
      } catch (err: any) {
        console.error("Error al cargar datos del programa:", err);
        
        if (err.response && err.response.status === 404) {
          setError("No se encontró un programa asignado");
        } else {
          setError("Error al cargar los detalles del programa");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgramData();
  }, [navigation]);
  
  // Alternar expandir/colapsar sección
  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  // Alternar expandir/colapsar factor clínico
  const toggleFactor = (factorIndex: number) => {
    const factorId = `factor-${factorIndex}`;
    if (expandedFactor === factorId) {
      setExpandedFactor(null);
    } else {
      setExpandedFactor(factorId);
    }
  };
  
  // Renderizar una lista con viñetas
  const renderBulletList = (items: any) => {
    if (!Array.isArray(items)) {
      return <Text style={styles.listText}>{items}</Text>;
    }
    
    return (
      <View style={styles.listContainer}>
        {items.map((item: string, index: number) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bulletPoint}>
              <Icon name="checkmark-circle" size={18} color={theme.colors.secondary} />
            </View>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Marcar recomendación como leída
  const markRecommendationAsRead = async (recommendationId: number) => {
    try {
      await api.patch(`/api/recommendations/${recommendationId}/`, {
        is_read: true
      });
      
      // Actualizar estado local
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_read: true } 
            : rec
        )
      );
      
      setPriorityRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_read: true } 
            : rec
        )
      );
    } catch (err) {
      console.error("Error al marcar recomendación como leída:", err);
    }
  };
  
  // Alternar expandir/colapsar recomendación
  const toggleRecommendation = (id: number) => {
    if (expandedRecommendation === id) {
      setExpandedRecommendation(null);
    } else {
      setExpandedRecommendation(id);
      // Marcar como leída al expandir
      markRecommendationAsRead(id);
    }
  };
  
  // Renderizar una recomendación con solo las herramientas en bullet points
  const renderRecommendation = (item: any, isPriority: boolean = false) => {
    const isExpanded = expandedRecommendation === item.id;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.recommendationCard,
          isPriority && styles.priorityCard,
          isExpanded && styles.expandedCard
        ]}
        onPress={() => toggleRecommendation(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.recommendationHeader}>
          <Text 
            style={[
              styles.recommendationTitle, 
              !item.is_read && styles.unreadTitle
            ]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.recommendation.title}
          </Text>
          
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.primary} 
          />
        </View>
        
        {isExpanded && item.recommendation.tools && (
          <View style={styles.expandedContent}>
            <Text style={styles.toolsTitle}>Herramientas sugeridas:</Text>
            {/* Convertir las herramientas en bullet points */}
            <View style={styles.toolsList}>
              {item.recommendation.tools.split(',').map((tool: string, index: number) => (
                <View key={index} style={styles.toolItem}>
                  <Icon name="checkmark-circle" size={16} color={theme.colors.secondary} />
                  <Text style={styles.toolText}>{tool.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  // Renderizar el contenido del programa usando datos del backend
  const renderProgramContent = () => {
    if (!userProgram || !userProgram.program_content) return null;
    
    const programContent = userProgram.program_content;
    const clinicalFactors = userProgram.clinical_factors || [];
    
    return (
      <Animated.View 
        style={[
          styles.programContentSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Secciones del programa - Datos del backend */}
        {programContent.sections.map((section: any, index: number) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.programSectionCard,
              expandedSection === section.id && styles.expandedSectionCard
            ]}
            onPress={() => toggleSection(section.id)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={[
                styles.sectionIconContainer,
                { backgroundColor: theme.colors.primary }
              ]}>
                {SECTION_ICONS[section.icon]}
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Icon 
                name={expandedSection === section.id ? "chevron-up" : "chevron-down"} 
                size={22} 
                color={theme.colors.primary} 
              />
            </View>
            
            {expandedSection === section.id && (
              <View style={styles.sectionContent}>
                {renderBulletList(section.content)}
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {/* Factores clínicos adicionales - Datos del backend */}
        {clinicalFactors.length > 0 && (
          <View style={styles.clinicalFactorsSection}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.clinicalFactorsTitle}>
                Factores Clínicos Adicionales
              </Text>
              <View style={styles.dividerLine} />
            </View>
            
            {clinicalFactors.map((factor: any, index: number) => {
              const factorId = `factor-${index}`;
              const isExpanded = expandedFactor === factorId;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.clinicalFactorCard,
                    isExpanded && styles.expandedFactorCard
                  ]}
                  onPress={() => toggleFactor(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.factorHeader}>
                    <View style={[
                      styles.factorIconContainer,
                      { backgroundColor: theme.colors.accent }
                    ]}>
                      {FACTOR_ICONS[factor.icon]}
                    </View>
                    <Text style={styles.factorTitle}>{factor.title}</Text>
                    <Icon 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={22} 
                      color={theme.colors.accent} 
                    />
                  </View>
                  
                  {isExpanded && (
                    <View style={styles.factorExpandedContent}>
                      <Text style={styles.factorContent}>{factor.content}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {/* Recomendaciones prioritarias integradas en la misma sección */}
        {priorityRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.recommendationsTitle}>
                Recomendaciones Prioritarias
              </Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.recommendationsSubtitle}>
              Estas son las recomendaciones más importantes para tu caso particular
            </Text>
            
            {priorityRecommendations.map(recommendation => 
              renderRecommendation(recommendation, true)
            )}
          </View>
        )}
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tu programa...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={48} color={theme.colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !userProgram ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Programa no encontrado</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera con el nombre personalizado */}
          <View style={styles.programHeaderContainer}>
            <View style={styles.programHeaderGradient}>
              <View style={styles.programHeader}>
                <View style={styles.programTitleContainer}>
                  <View style={styles.rocketIconContainer}>
                    <Icon name="rocket" size={32} color={theme.colors.primary} />
                  </View>
                  <View style={styles.programTitleTextContainer}>
                    <Text style={styles.programTitleSmall}>Tu Programa Personalizado</Text>
                    <Text style={styles.programTitle}>{userName}</Text>
                  </View>
                </View>
                <View style={styles.headerDecoration} />
              </View>
            </View>
          </View>
          
          {/* Información del ciclo */}
          {currentCycle && !cycleLoading && (
            <View style={styles.cycleInfoContainer}>
              <View style={styles.cycleInfo}>
                <View style={styles.cycleIconContainer}>
                  <Icon name="calendar" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.cycleTextContainer}>
                  <Text style={styles.cycleLabel}>
                    Ciclo {currentCycle.cycle_number}
                  </Text>
                  <Text style={styles.cycleProgress}>
                    Día {daysElapsed} de 30
                  </Text>
                </View>
                {daysRemaining <= 3 && daysRemaining > 0 && (
                  <View style={styles.cycleWarningBadge}>
                    <Text style={styles.cycleWarningText}>
                      {daysRemaining} días
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cycleInfoButton}
                  onPress={() => setShowCycleInfoModal(true)}
                >
                  <Icon name="information-circle-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Contenido del programa con todas las secciones integradas */}
          {renderProgramContent()}
        </ScrollView>
      )}
      
      {/* Modal de información de ciclos */}
      <CycleInfoModal />
      
      {/* Modal de renovación de ciclo */}
      <CycleRenewalModal
        visible={showRenewalModal}
        daysRemaining={daysRemaining}
        onStartRenewal={handleStartRenewal}
        onRemindLater={daysRemaining > 0 ? handleRemindLater : undefined}
      />
      
      {/* Barra de navegación inferior */}
      <TabNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 80, // Espacio para el TabNavigationBar
  },
  // Cabecera personalizada con nombre del usuario
  programHeaderContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  programHeaderGradient: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  programHeader: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.xl,
    position: 'relative',
  },
  programTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  programTitleTextContainer: {
    flex: 1,
  },
  programTitleSmall: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  programTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  rocketIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.md,
  },
  headerDecoration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.accent,
    opacity: 0.2,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
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
    ...theme.shadows.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  // Estilos para la información del ciclo
  cycleInfoContainer: {
    paddingHorizontal: theme.spacing.md,
    marginTop: -20, // Para acercarlo a la cabecera
    marginBottom: theme.spacing.md,
    zIndex: 10,
  },
  cycleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cycleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cycleTextContainer: {
    flex: 1,
  },
  cycleLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  cycleProgress: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  cycleWarningBadge: {
    backgroundColor: theme.colors.error.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  cycleWarningText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.error.main,
  },
  // Botón de información en el ciclo
  cycleInfoButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '90%',
    maxHeight: '80%',
    ...theme.shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
    marginBottom: theme.spacing.lg,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  modalText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  modalButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  // Sección del contenido del programa
  programContentSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    margin: theme.spacing.md,
    marginTop: -30, // Para superponerse a la cabecera
    ...theme.shadows.lg,
  },
  // Tarjetas de sección del programa
  programSectionCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  expandedSectionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sectionContent: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  // Estilo para listas con viñetas
  listContainer: {
    marginVertical: theme.spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  bulletPoint: {
    marginRight: theme.spacing.md,
  },
  listText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  // Divisor de sección
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  // Factores clínicos
  clinicalFactorsSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  clinicalFactorsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
  },
  clinicalFactorCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  expandedFactorCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
    ...theme.shadows.md,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  factorTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  factorExpandedContent: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  factorContent: {
    fontSize: theme.fontSize.base,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  // Sección de recomendaciones
  recommendationsSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  recommendationsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
  },
  recommendationsSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  priorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
  },
  expandedCard: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationTitle: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  expandedContent: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  toolsTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  // Nuevos estilos para listas de herramientas
  toolsList: {
    marginTop: theme.spacing.xs,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  toolText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  }
});