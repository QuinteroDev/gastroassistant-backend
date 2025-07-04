// ProgramDetailsScreen.tsx - VERSIÓN COMPLETA CON SECCIÓN "RECUERDA" Y AVATAR POR DEFECTO

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
  Image,
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

// 🆕 Lista de avatares disponibles CON avatar por defecto (debe coincidir con ProfileScreen)
const AVAILABLE_AVATARS = [
  { 
    id: 'default', 
    source: null, // Sin imagen - usará icono
    name: 'Sin avatar',
    isDefault: true 
  },
  { id: 'avatar1', source: require('../assets/images/avatars/avatar1.png'), name: 'Avatar 1' },
  { id: 'avatar2', source: require('../assets/images/avatars/avatar2.png'), name: 'Avatar 2' },
  { id: 'avatar3', source: require('../assets/images/avatars/avatar3.png'), name: 'Avatar 3' },
  { id: 'avatar4', source: require('../assets/images/avatars/avatar4.png'), name: 'Avatar 4' },
  { id: 'avatar5', source: require('../assets/images/avatars/avatar5.png'), name: 'Avatar 5' },
];

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
  const [userAvatar, setUserAvatar] = useState<string>('default'); // 🆕 Por defecto 'default'
  const [showCycleInfoModal, setShowCycleInfoModal] = useState(false);
  const [showClinicalFactorsModal, setShowClinicalFactorsModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
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
  
  // 🆕 Función mejorada para obtener la imagen del avatar
  const getAvatarImage = () => {
    const avatar = AVAILABLE_AVATARS.find(a => a.id === userAvatar);
    return avatar?.source || null;
  };
  
  // 🆕 Función para verificar si es avatar por defecto
  const isDefaultAvatar = () => {
    return userAvatar === 'default' || !userAvatar;
  };
  
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
  
  // MODAL 1: Información de ciclos
  const CycleInfoModal = () => (
    <Modal
      visible={showCycleInfoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCycleInfoModal(false)}
    >
      <View style={styles.cycleModalOverlay}>
        <View style={styles.cycleModalContent}>
          <View style={styles.cycleModalHeader}>
            <View style={styles.cycleModalIconContainer}>
              <Icon name="information-circle" size={40} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.cycleModalCloseButton}
              onPress={() => setShowCycleInfoModal(false)}
            >
              <Icon name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
  
          <Text style={styles.cycleModalTitle}>¿Qué son los ciclos?</Text>
          
          <View style={styles.cycleModalScrollContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={styles.cycleModalSection}>
                <View style={styles.cycleModalSectionHeader}>
                  <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.cycleModalSectionTitle}>Ciclos de 30 días</Text>
                </View>
                <Text style={styles.cycleModalText}>
                  Tu Plan Digestivo se organiza en ciclos de 30 días. Cada ciclo es una oportunidad para mejorar tus hábitos digestivos y evaluar tu progreso.
                </Text>
              </View>
    
              <View style={styles.cycleModalSection}>
                <View style={styles.cycleModalSectionHeader}>
                  <Icon name="refresh-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.cycleModalSectionTitle}>Evaluación mensual</Text>
                </View>
                <Text style={styles.cycleModalText}>
                  Al finalizar cada ciclo, realizarás una nueva evaluación para ajustar tu plan según tu evolución y necesidades actuales.
                </Text>
              </View>
    
              <View style={styles.cycleModalSection}>
                <View style={styles.cycleModalSectionHeader}>
                  <Icon name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.cycleModalSectionTitle}>Beneficios del sistema</Text>
                </View>
                <Text style={styles.cycleModalText}>
                  Este sistema de ciclos te permite mantener un seguimiento constante de tu progreso y adaptarte a los cambios en tu salud digestiva.
                </Text>
              </View>
              
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
  
          <TouchableOpacity
            style={styles.cycleModalButton}
            onPress={() => setShowCycleInfoModal(false)}
          >
            <Text style={styles.cycleModalButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // MODAL 2: Información de factores clínicos
  const ClinicalFactorsInfoModal = () => (
    <Modal
      visible={showClinicalFactorsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowClinicalFactorsModal(false)}
    >
      <View style={styles.clinicalModalOverlay}>
        <View style={styles.clinicalModalContent}>
          <View style={styles.clinicalModalHeader}>
            <View style={styles.clinicalModalIconContainer}>
              <Icon name="medical" size={40} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.clinicalModalCloseButton}
              onPress={() => setShowClinicalFactorsModal(false)}
            >
              <Icon name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.clinicalModalTitle}>¿Por qué se muestran estos factores?</Text>
          
          <View style={styles.clinicalModalSimpleContent}>
            <Text style={styles.clinicalModalSimpleText}>
              Pueden estar influyendo en tus síntomas digestivos. Tenerlos en cuenta te ayudará a enfocar mejor tu recuperación junto con el seguimiento médico.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.clinicalModalButton}
            onPress={() => setShowClinicalFactorsModal(false)}
          >
            <Text style={styles.clinicalModalButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // MODAL 3: Información de recomendaciones
  const RecommendationsInfoModal = () => (
    <Modal
      visible={showRecommendationsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRecommendationsModal(false)}
    >
      <View style={styles.recModalOverlay}>
        <View style={styles.recModalContent}>
          <View style={styles.recModalHeader}>
            <View style={styles.recModalIconContainer}>
              <Icon name="bulb" size={40} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.recModalCloseButton}
              onPress={() => setShowRecommendationsModal(false)}
            >
              <Icon name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.recModalTitle}>¿Por qué estas recomendaciones?</Text>
          
          <View style={styles.recModalSimpleContent}>
            <Text style={styles.recModalSimpleText}>
              Estas pautas han sido seleccionadas para ayudarte a mejorar según tu situación actual y los factores que pueden estar influyendo en tus síntomas digestivos. Es un plan personalizado que puedes comenzar a aplicar desde hoy mismo.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.recModalButton}
            onPress={() => setShowRecommendationsModal(false)}
          >
            <Text style={styles.recModalButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          
          // 🆕 Cargar avatar del usuario con mejor lógica
          console.log('🖼️ Avatar desde backend (ProgramDetails):', profileResponse.data.avatar);
          if (profileResponse.data.avatar && profileResponse.data.avatar !== '' && profileResponse.data.avatar !== null) {
            console.log('✅ Usando avatar guardado:', profileResponse.data.avatar);
            setUserAvatar(profileResponse.data.avatar);
          } else {
            console.log('⚠️ Sin avatar guardado, usando default');
            setUserAvatar('default');
          }
        }
        
        // Cargar el programa asignado
        const programResponse = await api.get('/api/programs/my-program/');
        
        if (programResponse.data) {
          console.log("Programa cargado desde backend:", programResponse.data);
          setUserProgram(programResponse.data);
        }
        
        // Cargar TODAS las recomendaciones
        const allRecommendationsResponse = await api.get('/api/recommendations/');
        
        if (allRecommendationsResponse.data) {
          console.log("Todas las recomendaciones:", allRecommendationsResponse.data);
          
          // Usar TODAS las recomendaciones como "prioritarias"
          setPriorityRecommendations(allRecommendationsResponse.data);
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
  
  // Renderizar una lista sin viñetas
  const renderBulletList = (items: any, isWhatCanYouDo = false) => {
    if (!Array.isArray(items)) {
      return (
        <View style={styles.forceWhiteBackground}>
          <Text style={styles.forceBlackText}>{items}</Text>
        </View>
      );
    }
    
    if (isWhatCanYouDo) {
      return (
        <View style={styles.forceWhiteBackground}>
          <View style={styles.whatCanYouDoList}>
            {items.map((item: string, index: number) => (
              <View key={index} style={styles.whatCanYouDoItemClean}>
                <Text style={styles.whatCanYouDoText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.forceWhiteBackground}>
        <View style={styles.listContainer}>
          {items.map((item: string, index: number) => (
            <View key={index} style={styles.listItemClean}>
              <Text style={styles.forceBlackText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Marcar recomendación como leída
  const markRecommendationAsRead = async (recommendationId: number) => {
    try {
      await api.patch(`/api/recommendations/${recommendationId}/`, {
        is_read: true
      });
      
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
      markRecommendationAsRead(id);
    }
  };
  
  // Renderizar una recomendación
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
          <View style={styles.forceWhiteBackground}>
            <Text style={styles.toolsTitle}>Herramientas sugeridas:</Text>
            <View style={styles.toolsList}>
              {item.recommendation.tools.split(',').map((tool: string, index: number) => (
                <View key={index} style={styles.toolItemClean}>
                  <Text style={styles.forceBlackText}>{tool.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 🔥 NUEVA FUNCIÓN: Renderizar sección "Recuerda" como párrafo informativo
  const renderRecuerdaSection = () => {
    if (!userProgram || !userProgram.program_content) return null;
    
    const programContent = userProgram.program_content;
    const recuerdaSection = programContent.sections.find((section: any) => 
      section.id === 'recordatorio'
    );

    if (!recuerdaSection) return null;

    return (
      <View style={styles.recuerdaInfoSection}>
        <View style={styles.recuerdaHeader}>
          <View style={styles.recuerdaIconContainer}>
            <Icon name="information-circle" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.recuerdaTitle}>Recuerda</Text>
        </View>
        <View style={styles.recuerdaContent}>
          <Text style={styles.recuerdaText}>
            {recuerdaSection.content}
          </Text>
        </View>
      </View>
    );
  };

  // Renderizar sección especial "¿Qué puedes hacer tú para mejorar?"
  const renderWhatCanYouDoSection = () => {
    if (!userProgram || !userProgram.program_content) return null;
    
    const programContent = userProgram.program_content;
    const whatCanYouDoSection = programContent.sections.find((section: any) => 
      section.title.toLowerCase().includes('qué puedes hacer') || 
      section.title.toLowerCase().includes('que puedes hacer')
    );

    if (!whatCanYouDoSection) return null;

    const isExpanded = expandedSection === 'what-can-you-do';

    return (
      <TouchableOpacity
        style={[
          styles.whatCanYouDoCard,
          isExpanded && styles.expandedWhatCanYouDoCard
        ]}
        onPress={() => setExpandedSection(isExpanded ? null : 'what-can-you-do')}
        activeOpacity={0.8}
      >
        <View style={styles.whatCanYouDoHeader}>
          <Text style={styles.whatCanYouDoTitle}>¿Qué puedes hacer tú para mejorar?</Text>
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={22} 
            color={theme.colors.primary} 
          />
        </View>
        
        {isExpanded && (
          <View style={styles.forceWhiteBackground}>
            {renderBulletList(whatCanYouDoSection.content, true)}
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
    
    // Filtrar las secciones para excluir "¿Qué puedes hacer tú para mejorar?" Y "Recuerda"
    const filteredSections = programContent.sections.filter((section: any) => 
      !section.title.toLowerCase().includes('qué puedes hacer') && 
      !section.title.toLowerCase().includes('que puedes hacer') &&
      section.id !== 'recordatorio' // ← NUEVA EXCLUSIÓN
    );
    
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
        {/* Secciones del programa - Datos del backend (filtradas) */}
        {filteredSections.map((section: any, index: number) => (
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

        {/* 🔥 NUEVO: Sección "Recuerda" como párrafo informativo */}
        {renderRecuerdaSection()}

        {/* Factores clínicos adicionales - Datos del backend */}
        {clinicalFactors.length > 0 && (
          <View style={styles.clinicalFactorsSection}>
            <View style={styles.sectionDivider}>
              <Text style={styles.clinicalFactorsTitle}>
                Factores de Riesgo
              </Text>
              <TouchableOpacity
                style={styles.clinicalFactorsInfoButton}
                onPress={() => setShowClinicalFactorsModal(true)}
              >
                <Icon name="help-circle-outline" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
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

        {/* TODAS las recomendaciones */}
        {priorityRecommendations.length > 0 && (
          <View style={styles.recommendationsHighlightSection}>
            <View style={styles.recommendationsBeautifulContainer}>
              <View style={styles.recommendationsPromoHeader}>
                <View style={styles.recommendationsPromoContent}>
                  <View style={styles.recommendationsPromoTextContainer}>
                    <Text style={styles.recommendationsPromoTitle}>Tus Pautas Personalizadas</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.recommendationsPromoInfoButton}
                    onPress={() => setShowRecommendationsModal(true)}
                  >
                    <Icon name="help-circle-outline" size={28} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.recommendationsContentContainer}>
                {/* Primero: "¿Qué puedes hacer tú para mejorar?" */}
                {renderWhatCanYouDoSection()}
                
                {/* Después: TODAS las recomendaciones */}
                {priorityRecommendations.map(recommendation => 
                  renderRecommendation(recommendation, true)
                )}
              </View>
            </View>
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
          {/* 🆕 Cabecera con el nombre personalizado Y AVATAR MEJORADO */}
          <View style={styles.programHeaderContainer}>
            <View style={styles.programHeaderGradient}>
              <View style={styles.programHeader}>
                <View style={styles.programTitleContainer}>
                  <View style={styles.avatarIconContainer}>
                    {getAvatarImage() ? (
                      <Image 
                        source={getAvatarImage()}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      // 🆕 Avatar por defecto con icono
                      <View style={styles.defaultAvatarContainer}>
                        <Icon name="person" size={28} color={theme.colors.secondary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.programTitleTextContainer}>
                    <Text style={styles.programTitleSmall}>Tu Plan Personalizado</Text>
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
                {daysRemaining === 0 && (
                  <View style={styles.cycleWarningBadge}>
                    <Text style={styles.cycleWarningText}>
                      Ciclo finalizado
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cycleInfoButton}
                  onPress={() => setShowCycleInfoModal(true)}
                >
                  <Icon name="information-circle-outline" size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Contenido del programa con todas las secciones integradas */}
          {renderProgramContent()}
        </ScrollView>
      )}
      
      {/* Modales */}
      <CycleInfoModal />
      <ClinicalFactorsInfoModal />
      <RecommendationsInfoModal />
      <CycleRenewalModal
        visible={showRenewalModal}
        daysRemaining={daysRemaining}
        onStartRenewal={handleStartRenewal}
        onRemindLater={daysRemaining > 0 ? handleRemindLater : undefined}
      />
      
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
    paddingBottom: 80,
  },
  
  // Estilos para forzar fondos blancos
  forceWhiteBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  forceBlackText: {
    color: '#000000',
    fontSize: theme.fontSize.base,
    lineHeight: 24,
    flex: 1,
  },
  
  // Cabecera personalizada con avatar
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
  avatarIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  // 🆕 Estilos para avatar por defecto
  defaultAvatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    marginTop: -20,
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
  cycleInfoButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },

  // 🔥 NUEVO: Estilos para la sección "Recuerda"
  recuerdaInfoSection: {
    backgroundColor: '#E8F5E8', // Fondo verde muy suave
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Verde suave
    ...theme.shadows.sm,
  },
  recuerdaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recuerdaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  recuerdaTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: '#2E7D32', // Verde más oscuro
  },
  recuerdaContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  recuerdaText: {
    fontSize: theme.fontSize.base,
    lineHeight: 24,
    color: '#1B5E20', // Verde oscuro para el texto
  },

  // MODALES - Estilos únicos para cada modal
  cycleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cycleModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    height: 500,
    ...theme.shadows.xl,
  },
  cycleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  cycleModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleModalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: theme.spacing.sm,
  },
  cycleModalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    textAlign: 'center',
  },
  cycleModalScrollContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  cycleModalSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  cycleModalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cycleModalSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  cycleModalText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  cycleModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  cycleModalButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.base,
    fontWeight: 'normal',
  },

  clinicalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  clinicalModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '90%',
    maxWidth: 400,
    ...theme.shadows.xl,
  },
  clinicalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  clinicalModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicalModalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: theme.spacing.sm,
  },
  clinicalModalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    textAlign: 'center',
  },
  clinicalModalSimpleContent: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  clinicalModalSimpleText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
  clinicalModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  clinicalModalButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.base,
    fontWeight: 'normal',
  },

  recModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    ...theme.shadows.xl,
  },
  recModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  recModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recModalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: theme.spacing.sm,
  },
  recModalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    textAlign: 'center',
  },
  recModalSimpleContent: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  recModalSimpleText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
  recModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  recModalButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.base,
    fontWeight: 'normal',
  },

  // Sección del contenido del programa
  programContentSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    margin: theme.spacing.md,
    marginTop: -30,
    ...theme.shadows.lg,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  clinicalFactorsSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  clinicalFactorsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  clinicalFactorsInfoButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
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
  recommendationsHighlightSection: {
    marginTop: theme.spacing.xl,
  },
  recommendationsBeautifulContainer: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    ...theme.shadows.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recommendationsPromoHeader: {
    backgroundColor: 'transparent',
    marginBottom: theme.spacing.lg,
  },
  recommendationsPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  recommendationsPromoTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  recommendationsPromoTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  recommendationsPromoInfoButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: `${theme.colors.white}20`,
  },
  recommendationsContentContainer: {
    // Sin estilos especiales
  },
  
  // Estilos para "¿Qué puedes hacer tú para mejorar?"
  whatCanYouDoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.lg,
  },
  expandedWhatCanYouDoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.secondary,
    ...theme.shadows.xl,
  },
  whatCanYouDoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  whatCanYouDoTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: '#000000',
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

  // Estilos sin bullets
  listContainer: {
    marginVertical: 0,
    paddingHorizontal: 0,
  },
  listItemClean: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  whatCanYouDoList: {
    paddingVertical: theme.spacing.xs,
  },
  whatCanYouDoItemClean: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  whatCanYouDoText: {
    fontSize: theme.fontSize.base,
    lineHeight: 24,
    color: '#000000',
    fontWeight: '400',
    textAlign: 'left',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    ...theme.shadows.md,
  },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.primary,
    borderWidth: 2,
    ...theme.shadows.lg,
  },
  expandedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.secondary,
    borderWidth: 2,
    ...theme.shadows.xl,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  recommendationTitle: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: '#000000',
    marginRight: theme.spacing.sm,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  toolsTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  toolsList: {
    marginTop: theme.spacing.xs,
  },
  toolItemClean: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
});