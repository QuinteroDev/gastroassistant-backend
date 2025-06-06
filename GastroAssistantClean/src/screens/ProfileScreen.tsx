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
  Switch,
  Alert,
  Linking,
  Animated,
  Dimensions
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
import { storeData, getData, removeData } from '../utils/storage';
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
  ProfileUpdate?: undefined;
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
}

const { width } = Dimensions.get('window');

// Función para obtener el estado del IMC
const getBMIStatus = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Bajo peso', color: theme.colors.info.main };
  if (bmi < 25) return { label: 'Peso normal', color: theme.colors.success.main };
  if (bmi < 30) return { label: 'Sobrepeso', color: theme.colors.warning.main };
  return { label: 'Obesidad', color: theme.colors.error.main };
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  
  // Configuración de la aplicación
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Cargar datos reales del usuario
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/profiles/me/');
        
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
        }
        
        const notifPref = await getData('notificationsEnabled');
        if (notifPref !== null) {
          setNotificationsEnabled(notifPref === 'true');
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
  
  // Guardar preferencias cuando cambien
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await storeData('notificationsEnabled', String(notificationsEnabled));
      } catch (error) {
        console.error("Error al guardar preferencias:", error);
      }
    };
    
    savePreferences();
  }, [notificationsEnabled]);
  
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
  
  // Renderizar avatar con iniciales
  const renderAvatar = () => {
    const initials = userProfile.first_name 
      ? userProfile.first_name.charAt(0).toUpperCase() 
      : userProfile.username.charAt(0).toUpperCase();
    
    return (
      <Animated.View 
        style={[
          styles.avatarContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </Animated.View>
    );
  };
  
  // Renderizar tarjetas de salud
  const renderHealthCards = () => {
    const bmiStatus = userProfile.bmi > 0 ? getBMIStatus(userProfile.bmi) : null;
    
    return (
      <View style={styles.healthCardsContainer}>
        <Text style={styles.sectionTitle}>Tu Salud</Text>
        
        <View style={styles.healthCardsRow}>
          {/* IMC Card */}
          <TouchableOpacity style={styles.healthCard} activeOpacity={0.8}>
            <View style={[styles.healthIconContainer, { backgroundColor: `${bmiStatus?.color || theme.colors.primary}15` }]}>
              <FontAwesome5 name="weight" size={24} color={bmiStatus?.color || theme.colors.primary} />
            </View>
            <Text style={styles.healthCardTitle}>IMC</Text>
            <Text style={[styles.healthCardValue, { color: bmiStatus?.color || theme.colors.primary }]}>
              {userProfile.bmi > 0 ? userProfile.bmi.toFixed(1) : '--'}
            </Text>
            {bmiStatus && (
              <Text style={styles.healthCardLabel}>{bmiStatus.label}</Text>
            )}
          </TouchableOpacity>
          
          {/* Scores Card */}
          <TouchableOpacity style={styles.healthCard} activeOpacity={0.8}>
            <View style={[styles.healthIconContainer, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.secondary} />
            </View>
            <Text style={styles.healthCardTitle}>Scores</Text>
            <View style={styles.scoresContainer}>
              <Text style={styles.scoreItem}>
                GERD-Q: {userProfile.gerdq_score || '--'}
              </Text>
              <Text style={styles.scoreItem}>
                RSI: {userProfile.rsi_score || '--'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Renderizar datos clínicos mejorado
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
    
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Datos Clínicos</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('ProfileUpdate')}
          >
            <Icon name="create-outline" size={20} color={theme.colors.primary} />
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
          </View>
        </View>
      </View>
    );
  };
  
  // Renderizar configuración mejorada
  const renderSettings = () => {
    const settingsItems = [
      {
        icon: <Icon name="notifications-outline" size={22} color={theme.colors.primary} />,
        label: 'Notificaciones',
        type: 'switch',
        value: notificationsEnabled,
        onValueChange: (value: boolean) => {
          setNotificationsEnabled(value);
          if (value) {
            console.log("Activando notificaciones");
          }
        }
      },
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
              {item.type === 'switch' ? (
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    {item.icon}
                    <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
                      {item.label}
                    </Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: '#E0E0E0', true: `${theme.colors.primary}50` }}
                    thumbColor={item.value ? theme.colors.primary : '#f4f3f4'}
                  />
                </View>
              ) : (
                <TouchableOpacity style={styles.settingRow} onPress={item.onPress}>
                  <View style={styles.settingLeft}>
                    {item.icon}
                    <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
                      {item.label}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#999999" />
                </TouchableOpacity>
              )}
              {index < settingsItems.length - 1 && <View style={styles.settingDivider} />}
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Renderizar sección de ayuda mejorada
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
          <Text style={styles.copyrightText}>© 2024 Lymbia</Text>
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
          
          {/* Tarjetas de salud */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {renderHealthCards()}
            {renderClinicalData()}
            {renderSettings()}
            {renderSupport()}
          </Animated.View>
          
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
    ...theme.shadows.lg,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
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
  
  // Tarjetas de salud
  healthCardsContainer: {
    paddingHorizontal: theme.spacing.md,
    marginTop: -40,
    marginBottom: theme.spacing.md,
  },
  healthCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  healthCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  healthIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  healthCardTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  healthCardValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
  },
  healthCardLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  scoresContainer: {
    alignItems: 'center',
  },
  scoreItem: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    marginVertical: 2,
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
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}10`,
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
    height: 40,
    backgroundColor: theme.colors.border.light,
  },
  
  // Configuración
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