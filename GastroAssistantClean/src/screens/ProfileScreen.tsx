import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainHeaderComponent from '../components/MainHeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../utils/api';
import { removeData } from '../utils/storage';
import { theme } from '../constants/theme';

// Tipos
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
  ChangePassword?: undefined;
  HelpCenter?: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  has_endoscopy: boolean;
  endoscopy_result: string;
  has_ph_monitoring: boolean;
  ph_monitoring_result: string;
  onboarding_complete: boolean;
  gerdq_score?: number;
  rsi_score?: number;
  avatar?: string;
}

// 🆕 Lista de avatares disponibles CON avatar por defecto
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

const { width } = Dimensions.get('window');

// Función para obtener el estado del IMC
const getBMIStatus = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Bajo peso', color: theme.colors.info.main };
  if (bmi <= 24.9) return { label: 'Peso normal', color: theme.colors.success.main };
  if (bmi <= 29.9) return { label: 'Sobrepeso', color: theme.colors.warning.main };
  return { label: 'Obesidad', color: theme.colors.error.main };
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('default'); // 🆕 Por defecto 'default'
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "",
    email: "",
    first_name: "",
    weight_kg: 0,
    height_cm: 0,
    bmi: 0,
    has_endoscopy: false,
    endoscopy_result: "",
    has_ph_monitoring: false,
    ph_monitoring_result: "",
    onboarding_complete: false
  });
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const avatarModalScale = useRef(new Animated.Value(0.9)).current;
  const avatarModalOpacity = useRef(new Animated.Value(0)).current;
  
  // Cargar datos reales del usuario
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/profiles/me/');
        console.log('🔍 Respuesta completa del perfil:', response.data);
        
        if (response.data) {
          let bmi = 0;
          if (response.data.weight_kg && response.data.height_cm) {
            const heightInMeters = response.data.height_cm / 100;
            bmi = response.data.weight_kg / (heightInMeters * heightInMeters);
          }
          
          setUserProfile({
            ...response.data,
            bmi: bmi || 0
          });
          
          // 🆕 DEBUGGING: Cargar avatar guardado con logs detallados
          console.log('🖼️ Avatar desde backend:', response.data.avatar);
          console.log('🖼️ Tipo de avatar:', typeof response.data.avatar);
          console.log('🖼️ Avatar es null?:', response.data.avatar === null);
          console.log('🖼️ Avatar es undefined?:', response.data.avatar === undefined);
          console.log('🖼️ Avatar es string vacío?:', response.data.avatar === '');
          
          if (response.data.avatar && response.data.avatar !== '' && response.data.avatar !== null) {
            console.log('✅ Usando avatar guardado:', response.data.avatar);
            setSelectedAvatar(response.data.avatar);
          } else {
            console.log('⚠️ Sin avatar guardado, usando default');
            setSelectedAvatar('default'); // Por defecto
          }
        }
        
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
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError("No pudimos cargar tu perfil. Por favor, intenta más tarde.");
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);
  
  // Animaciones del modal de información
  useEffect(() => {
    if (showUpdateModal) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showUpdateModal]);
  
  // Animaciones del modal de avatar
  useEffect(() => {
    if (showAvatarModal) {
      Animated.parallel([
        Animated.spring(avatarModalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(avatarModalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(avatarModalScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(avatarModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAvatarModal]);
  
  // 🆕 Función mejorada para guardar avatar
  const saveAvatar = async (avatarId: string) => {
    try {
      console.log('💾 Guardando avatar:', avatarId);
      
      // Actualizar el estado local inmediatamente
      setSelectedAvatar(avatarId);
      
      // Guardar en el backend
      const response = await api.patch('/api/profiles/me/', { avatar: avatarId });
      console.log('✅ Avatar guardado exitosamente:', response.data);
      
      // Actualizar el perfil local también
      setUserProfile(prev => ({
        ...prev,
        avatar: avatarId
      }));
      
      setShowAvatarModal(false);
      
      // Pequeña animación de confirmación
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (error) {
      console.error("❌ Error al guardar avatar:", error);
      console.error("Detalles del error:", error.response?.data);
      
      // Revertir el estado si hay error
      const previousAvatar = userProfile.avatar || 'default';
      setSelectedAvatar(previousAvatar);
      
      Alert.alert("Error", "No se pudo actualizar el avatar. Intenta de nuevo.");
    }
  };
  
  // 🆕 Función mejorada para obtener la imagen del avatar
  const getAvatarImage = () => {
    const avatar = AVAILABLE_AVATARS.find(a => a.id === selectedAvatar);
    return avatar?.source || null;
  };
  
  // 🆕 Función para verificar si es avatar por defecto
  const isDefaultAvatar = () => {
    return selectedAvatar === 'default' || !selectedAvatar;
  };
  
  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres salir de la aplicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              try {
                await api.post('/api/auth/logout/');
              } catch (logoutError) {
                console.log("Endpoint de logout no disponible:", logoutError);
              }
              
              await removeData('authToken');
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar sesión. Intenta de nuevo.");
            }
          }
        }
      ]
    );
  };
  
  // 🆕 Renderizar avatar mejorado con soporte para avatar por defecto
  const renderAvatar = () => {
    const avatarImage = getAvatarImage();
    
    return (
      <Animated.View 
        style={[
          styles.avatarContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.avatar}
          onPress={() => setShowAvatarModal(true)}
          activeOpacity={0.8}
        >
          {avatarImage ? (
            <Image 
              source={avatarImage}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            // 🆕 Avatar por defecto con icono
            <View style={styles.defaultAvatarContainer}>
              <Icon name="person" size={48} color={theme.colors.white} />
            </View>
          )}
          
          {/* Indicador de que es clickeable */}
          <View style={styles.avatarEditIndicator}>
            <Icon name="camera" size={16} color={theme.colors.white} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // 🆕 Renderizar modal de selección de avatar mejorado
  const renderAvatarModal = () => {
    return (
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.avatarModalContainer,
              {
                opacity: avatarModalOpacity,
                transform: [{ scale: avatarModalScale }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="person-circle" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Elige tu Avatar</Text>
            </View>
            
            <View style={styles.avatarGrid}>
              {AVAILABLE_AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar.id && styles.avatarOptionSelected
                  ]}
                  onPress={() => saveAvatar(avatar.id)}
                >
                  {avatar.source ? (
                    <Image 
                      source={avatar.source}
                      style={styles.avatarOptionImage}
                      resizeMode="cover"
                    />
                  ) : (
                    // 🆕 Opción por defecto
                    <View style={styles.defaultAvatarOption}>
                      <Icon name="person" size={28} color={theme.colors.text.secondary} />
                    </View>
                  )}
                  
                  {selectedAvatar === avatar.id && (
                    <View style={styles.avatarSelectedIndicator}>
                      <Icon name="checkmark" size={16} color={theme.colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowAvatarModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  // Renderizar modal de información de actualización
  const renderUpdateModal = () => {
    return (
      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="information-circle" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Actualizar Datos Clínicos</Text>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Para actualizar tu información clínica (peso, altura, resultados de pruebas), 
                deberás completar los cuestionarios al inicio del próximo ciclo.
              </Text>
              
              <View style={styles.modalSteps}>
                <View style={styles.modalStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>El sistema te notificará cuando inicie un nuevo ciclo</Text>
                </View>
                
                <View style={styles.modalStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Podrás actualizar tus datos en los cuestionarios iniciales</Text>
                </View>
                
                <View style={styles.modalStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Tu programa se adaptará automáticamente a la nueva información</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  // Renderizar datos clínicos mejorado con IMC incluido
  const renderClinicalData = () => {
    const tests = [
      {
        name: 'Endoscopia',
        icon: <MaterialCommunityIcons name="stomach" size={24} color={theme.colors.primary} />,
        done: userProfile.has_endoscopy,
        result: userProfile.endoscopy_result === "NORMAL" ? "Normal" : "Con hallazgos",
        color: userProfile.endoscopy_result === "NORMAL" ? theme.colors.success.main : theme.colors.warning.main
      },
      {
        name: 'pH-metría',
        icon: <MaterialCommunityIcons name="test-tube" size={24} color={theme.colors.primary} />,
        done: userProfile.has_ph_monitoring,
        result: userProfile.ph_monitoring_result === "POSITIVE" ? "Positiva" : "Negativa",
        color: userProfile.ph_monitoring_result === "POSITIVE" ? theme.colors.warning.main : theme.colors.success.main
      }
    ];
    
    const bmiStatus = userProfile.bmi > 0 ? getBMIStatus(userProfile.bmi) : null;
    
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Datos Clínicos</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setShowUpdateModal(true)}
          >
            <Icon name="information-circle-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {tests.map((test, index) => (
          <View key={index} style={styles.testCard}>
            <View style={styles.testIconContainer}>
              {test.icon}
            </View>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={[
                styles.testResult,
                { color: test.done ? test.color : theme.colors.text.secondary }
              ]}>
                {test.done ? test.result : 'No realizada'}
              </Text>
            </View>
            {test.done && (
              <Icon name="checkmark-circle" size={24} color={test.color} />
            )}
          </View>
        ))}
        
        <View style={styles.measurementsCard}>
          <View style={styles.measurementRow}>
            <View style={styles.measurementItem}>
              <Icon name="person-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.measurementLabel}>Altura</Text>
              <Text style={styles.measurementValue}>
                {userProfile.height_cm || '--'} {userProfile.height_cm ? 'cm' : ''}
              </Text>
            </View>
            <View style={styles.measurementDivider} />
            <View style={styles.measurementItem}>
              <FontAwesome5 name="weight" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.measurementLabel}>Peso</Text>
              <Text style={styles.measurementValue}>
                {userProfile.weight_kg || '--'} {userProfile.weight_kg ? 'kg' : ''}
              </Text>
            </View>
            <View style={styles.measurementDivider} />
            <View style={styles.measurementItem}>
              <MaterialCommunityIcons name="human" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.measurementLabel}>IMC</Text>
              <Text style={[
                styles.measurementValue,
                bmiStatus && { color: bmiStatus.color }
              ]}>
                {userProfile.bmi > 0 ? userProfile.bmi.toFixed(1) : '--'}
              </Text>
              {bmiStatus && (
                <Text style={[styles.bmiStatus, { color: bmiStatus.color }]}>
                  {bmiStatus.label}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Renderizar configuración simplificada
  const renderSettings = () => {
    const settingsItems = [
      {
        icon: <Icon name="lock-closed-outline" size={22} color={theme.colors.primary} />,
        label: 'Cambiar Contraseña',
        type: 'navigation',
        onPress: () => navigation.navigate('ChangePassword')
      },
      {
        icon: <Icon name="log-out-outline" size={22} color={theme.colors.error.main} />,
        label: 'Cerrar Sesión',
        type: 'navigation',
        danger: true,
        onPress: handleLogout
      }
    ];
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <View style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity style={styles.settingRow} onPress={item.onPress}>
                <View style={styles.settingLeft}>
                  {item.icon}
                  <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
                    {item.label}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color="#999999" />
              </TouchableOpacity>
              {index < settingsItems.length - 1 && <View style={styles.settingDivider} />}
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Renderizar sección de ayuda
  const renderSupport = () => {
    const supportItems = [
      {
        icon: <Icon name="help-circle-outline" size={22} color={theme.colors.primary} />,
        label: 'Centro de Ayuda',
        onPress: () => navigation.navigate('HelpCenter')
      },
      {
        icon: <Icon name="mail-outline" size={22} color={theme.colors.primary} />,
        label: 'Contactar Soporte',
        onPress: () => {
          if (Platform.OS === 'web') {
            // @ts-ignore
            window.location.href = 'mailto:info@lymbia.com';
          } else {
            Linking.openURL('mailto:info@lymbia.com');
          }
        }
      },
      {
        icon: <Icon name="document-text-outline" size={22} color={theme.colors.primary} />,
        label: 'Términos y Condiciones',
        onPress: async () => {
          const url = 'https://lymbia.com/terms-of-service/';
          if (Platform.OS === 'web') {
            // @ts-ignore
            window.open(url, '_blank');
          } else {
            await Linking.openURL(url);
          }
        }
      },
      {
        icon: <Icon name="shield-checkmark-outline" size={22} color={theme.colors.primary} />,
        label: 'Política de Privacidad',
        onPress: async () => {
          const url = 'https://lymbia.com/privacy-policy/';
          if (Platform.OS === 'web') {
            // @ts-ignore
            window.open(url, '_blank');
          } else {
            await Linking.openURL(url);
          }
        }
      }
    ];
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Ayuda y Soporte</Text>
        
        {supportItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.supportItem}
            onPress={item.onPress}
          >
            <View style={styles.supportIconContainer}>
              {item.icon}
            </View>
            <Text style={styles.supportLabel}>{item.label}</Text>
            <Icon name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        ))}
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>GastroAssistant v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Lymbia</Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tu perfil...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
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
          {/* Header del perfil */}
          <View style={styles.profileHeaderBackground}>
            <View style={styles.profilePattern} />
            <Animated.View 
              style={[
                styles.profileHeaderContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.multiply(slideAnim, -1) }]
                }
              ]}
            >
              {renderAvatar()}
              <Text style={styles.profileName}>
                {userProfile.first_name || userProfile.username || 'Usuario'}
              </Text>
              <Text style={styles.profileEmail}>
                {userProfile.email || 'No hay correo registrado'}
              </Text>
            </Animated.View>
          </View>
          
          {/* Contenido principal */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginTop: -20
            }}
          >
            {renderClinicalData()}
            {renderSettings()}
            {renderSupport()}
          </Animated.View>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
      
      {/* Modales */}
      {renderUpdateModal()}
      {renderAvatarModal()}
      
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
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
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  
  // Header del perfil
  profileHeaderBackground: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  profilePattern: {
    position: 'absolute',
    left: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.secondary,
    opacity: 0.1,
  },
  profileHeaderContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  // 🆕 Estilos para avatar por defecto
  defaultAvatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
  },
  avatarEditIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Secciones
  sectionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal de información
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalHeader: {
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
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: theme.spacing.xl,
  },
  modalText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalSteps: {
    gap: theme.spacing.md,
  },
  modalStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minWidth: 120,
  },
  modalButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minWidth: 120,
  },
  modalButtonSecondaryText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // 🆕 Modal de avatar mejorado
  avatarModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 380, // Un poco más ancho para acomodar 6 avatares
    ...theme.shadows.lg,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  // 🆕 Estilos para opción de avatar por defecto
  defaultAvatarOption: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 27,
  },
  avatarSelectedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Datos clínicos
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  testIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${theme.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  testResult: {
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
  measurementsCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginVertical: theme.spacing.xs,
  },
  measurementValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  measurementDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.border.light,
  },
  bmiStatus: {
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  
  // Configuración simplificada
  settingsCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
  },
  settingDivider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.md,
  },
  dangerText: {
    color: theme.colors.error.main,
  },
  
  // Soporte
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  supportLabel: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  versionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  copyrightText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  
  bottomSpacer: {
    height: 80,
  },
});