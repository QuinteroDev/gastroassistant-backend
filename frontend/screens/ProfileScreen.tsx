// screens/ProfileScreen.tsx
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
  Alert
} from 'react-native';
import HeaderComponent from '../components/HeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({
    username: "usuario123",
    email: "usuario@example.com",
    first_name: "Usuario",
    phenotype: "NERD",
    phenotype_display: "ERGE No Erosiva (NERD)",
    weight_kg: 72,
    height_cm: 175,
    bmi: 23.5,
    has_endoscopy: true,
    endoscopy_result: "NORMAL",
    has_ph_monitoring: true,
    ph_monitoring_result: "POSITIVE",
    onboarding_complete: true
  });
  
  // Configuración de la aplicación
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Simular carga de datos
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // En una versión real, aquí harías la llamada API
        // const response = await api.get('/api/profiles/me/');
        // setUserProfile(response.data);
        
        // Simular retraso de carga
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError("No pudimos cargar tu perfil. Por favor, intenta más tarde.");
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);
  
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
              // Eliminar token de autenticación
              await SecureStore.deleteItemAsync('authToken');
              
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
  
  // Renderizar sección de datos clínicos
  const renderClinicalData = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Datos Clínicos</Text>
        
        <View style={styles.clinicalCard}>
          <View style={styles.clinicalHeader}>
            <Ionicons name="medical" size={24} color="#0077B6" />
            <Text style={styles.clinicalTitle}>Perfil Digestivo</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Fenotipo:</Text>
            <Text style={styles.dataValue}>{userProfile.phenotype_display}</Text>
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
            <Text style={styles.dataValue}>{userProfile.weight_kg} kg</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Altura:</Text>
            <Text style={styles.dataValue}>{userProfile.height_cm} cm</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>IMC:</Text>
            <Text style={styles.dataValue}>{userProfile.bmi.toFixed(1)}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.updateButton}>
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
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#0077B6' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color="#0077B6" />
              <Text style={styles.settingLabel}>Modo Oscuro</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkModeEnabled ? '#0077B6' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity style={styles.settingRow}>
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
  
  // Renderizar sección de soporte
  const renderSupport = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="help-circle" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Centro de Ayuda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="mail" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Contactar con Soporte</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="document-text" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Términos y Condiciones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="shield-checkmark" size={22} color="#0077B6" />
          <Text style={styles.supportButtonText}>Política de Privacidad</Text>
        </TouchableOpacity>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
        </View>
      </View>
    );
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
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          {/* Cabecera del perfil */}
          <View style={styles.profileHeaderContainer}>
            <LinearGradient
              colors={['#00B4D8', '#0077B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileHeader}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              
              <Text style={styles.profileName}>
                {userProfile.first_name || userProfile.username}
              </Text>
              
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
              
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#fff" />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
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
  // Cabecera del perfil
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#ffffff',
    marginLeft: 6,
    fontWeight: '500',
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