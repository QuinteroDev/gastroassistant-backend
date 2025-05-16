import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Switch,
  Alert,
  Linking
} from 'react-native';
import HeaderComponent from '../components/HeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
// Importa las funciones de almacenamiento del módulo storage en lugar de SecureStore
import { storeData, getData, removeData } from '../utils/storage';

export default function ProfileScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({
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
  
  // Cargar datos reales del usuario
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Obtener datos del perfil de usuario del backend
        const response = await api.get('/api/profiles/me/');
        
        if (response.data) {
          // Calcular el IMC si tenemos peso y altura
          let bmi = 0;
          if (response.data.weight_kg && response.data.height_cm) {
            const heightInMeters = response.data.height_cm / 100;
            bmi = response.data.weight_kg / (heightInMeters * heightInMeters);
          }
          
          // Actualizar el estado con los datos del usuario
          setUserProfile({
            ...response.data,
            bmi: bmi || 0
          });
        }
        
        // Cargar preferencias guardadas usando storage.ts
        const notifPref = await getData('notificationsEnabled');
        
        if (notifPref !== null) {
          setNotificationsEnabled(notifPref === 'true');
        }
        
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
        // Usar storage.ts para guardar las preferencias
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
              // Llamar al endpoint de logout (si existe)
              try {
                await api.post('/api/auth/logout/');
              } catch (logoutError) {
                // Si no existe endpoint de logout o falla, continuamos con el proceso
                console.log("Endpoint de logout no disponible:", logoutError);
              }
              
              // Eliminar token de autenticación usando storage.ts
              await removeData('authToken');
              
              // Navegar a la pantalla de login
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
  
  // Manejar actualización de datos clínicos
  const handleUpdateClinical = () => {
    navigation.navigate('ProfileUpdate');
  };
  
  // Manejar cambio de contraseña
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };
  
  // Renderizar sección de datos clínicos
  const renderClinicalData = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Datos Clínicos</Text>
        
        <View style={styles.clinicalCard}>
          <View style={styles.clinicalHeader}>
            <Ionicons name="medical" size={24} color="#0077B6" />
            <Text style={styles.clinicalTitle}>Resultados de Pruebas</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Endoscopia:</Text>
            <Text style={styles.dataValue}>
              {userProfile.has_endoscopy ? 
                (userProfile.endoscopy_result === "NORMAL" ? "Normal" : "Con hallazgos") : 
                "No realizada"}
            </Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>pH-metría:</Text>
            <Text style={styles.dataValue}>
              {userProfile.has_ph_monitoring ? 
                (userProfile.ph_monitoring_result === "POSITIVE" ? "Positiva" : "Negativa") : 
                "No realizada"}
            </Text>
          </View>
        </View>
        
        <View style={styles.clinicalCard}>
          <View style={styles.clinicalHeader}>
            <FontAwesome5 name="weight" size={20} color="#0077B6" />
            <Text style={styles.clinicalTitle}>Medidas Corporales</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Peso:</Text>
            <Text style={styles.dataValue}>{userProfile.weight_kg || 'No especificado'} {userProfile.weight_kg ? 'kg' : ''}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Altura:</Text>
            <Text style={styles.dataValue}>{userProfile.height_cm || 'No especificado'} {userProfile.height_cm ? 'cm' : ''}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>IMC:</Text>
            <Text style={styles.dataValue}>
              {userProfile.bmi > 0 ? userProfile.bmi.toFixed(1) : 'No calculado'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={handleUpdateClinical}
        >
          <Text style={styles.updateButtonText}>Actualizar Datos Clínicos</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Renderizar sección de configuración
  const renderSettings = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications" size={20} color="#0077B6" />
              <Text style={styles.settingLabel}>Notificaciones</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                if (value) {
                  // Lógica para registrar notificaciones si están habilitadas
                  registerForNotifications();
                }
              }}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#0077B6' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={handleChangePassword}
          >
            <View style={styles.settingLabelContainer}>
              <Ionicons name="lock-closed" size={20} color="#0077B6" />
              <Text style={styles.settingLabel}>Cambiar Contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          

        </View>
      </View>
    );
  };
  
  // Función para registrar notificaciones
  const registerForNotifications = async () => {
    try {
      // Aquí iría la lógica para registrar dispositivo para notificaciones push
      console.log("Registrando dispositivo para notificaciones");
      // Por ejemplo: enviar token del dispositivo al backend
    } catch (error) {
      console.error("Error al registrar notificaciones:", error);
    }
  };
  
  // Función para abrir enlaces externos
  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("No se puede abrir la URL: " + url);
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error al abrir URL:', error);
    }
  };

  // Gestionar acciones de soporte
  const handleSupportAction = (action) => {
    switch (action) {
      case 'help':
        navigation.navigate('HelpCenter');
        break;
      case 'contact':
        // Abrir correo electrónico
        if (Platform.OS === 'web') {
          window.location.href = 'mailto:info@lymbia.com';
        } else {
          Linking.openURL('mailto:info@lymbia.com');
        }
        break;
      case 'terms':
        openURL('https://lymbia.com/terms-of-service/');
        break;
      case 'privacy':
        openURL('https://lymbia.com/privacy-policy/');
        break;
      default:
        break;
    }
  };
  
  // Renderizar sección de soporte
  const renderSupport = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => handleSupportAction('help')}
        >
          <Ionicons name="help-circle" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Centro de Ayuda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => handleSupportAction('contact')}
        >
          <Ionicons name="mail" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Contactar con Soporte</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => handleSupportAction('terms')}
        >
          <Ionicons name="document-text" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Términos y Condiciones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => handleSupportAction('privacy')}
        >
          <Ionicons name="shield-checkmark" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Política de Privacidad</Text>
        </TouchableOpacity>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
        </View>
      </View>
    );
  };
  
  // Función para reintentar la carga
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // La carga se ejecutará automáticamente gracias al useEffect
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent title="Mi Perfil" />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando tu perfil...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          {/* Cabecera del perfil - Simplificada */}
          <View style={styles.profileHeaderContainer}>
            <LinearGradient
              colors={['#00B4D8', '#0077B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileHeader}
            >
              <Text style={styles.profileName}>
                {userProfile.first_name || userProfile.username || 'Usuario'}
              </Text>
              
              <Text style={styles.profileEmail}>{userProfile.email || 'No hay correo registrado'}</Text>
            </LinearGradient>
          </View>
          
          {/* Datos clínicos */}
          {renderClinicalData()}
          
          {/* Configuración */}
          {renderSettings()}
          
          {/* Soporte */}
          {renderSupport()}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0077B6',
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
  // Cabecera del perfil - simplificada
  profileHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  profileHeader: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Secciones comunes
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
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
  // Datos clínicos
  clinicalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0077B6',
  },
  clinicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clinicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0077B6',
    marginLeft: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#0077B6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Configuración
  settingsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  // Soporte
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  supportButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});