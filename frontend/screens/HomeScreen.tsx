// screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import HeaderComponent from '../components/HeaderComponent';
import { LinearGradient } from 'expo-linear-gradient';

// URL Base para la API
const API_URL = 'http://192.168.1.48:8000';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Colores para cada tipo de programa
const programColors = {
  'A': ['#0077B6', '#00B4D8'], // GerdQ y RSI positivos
  'B': ['#0096C7', '#48CAE4'], // GerdQ positivo, RSI negativo
  'C': ['#023E8A', '#0077B6'], // GerdQ negativo, RSI positivo
  'D': ['#03045E', '#023E8A']  // GerdQ y RSI negativos
};

// Descripciones cortas para cada programa
const programDescriptions = {
  'A': 'Este programa está diseñado para personas con síntomas tanto de reflujo gastroesofágico como de reflujo laringofaríngeo. Incluye recomendaciones específicas para tratar ambas condiciones.',
  'B': 'Este programa se enfoca en el manejo del reflujo gastroesofágico. Incluye estrategias dietéticas y de estilo de vida para reducir la acidez y mejorar tu digestión.',
  'C': 'Este programa está especializado en el manejo del reflujo laringofaríngeo. Se centra en reducir la irritación de la garganta y los síntomas respiratorios asociados.',
  'D': 'Este programa preventivo te ayudará a mantener una buena salud digestiva y prevenir futuros problemas. Incluye hábitos saludables para tu sistema digestivo.'
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  const [userProgram, setUserProgram] = useState<any>(null);

  // Verificar token y cargar datos al iniciar
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      
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
        const profileResponse = await fetch(`${API_URL}/api/profiles/me/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.first_name) {
            setUserName(profileData.first_name);
          }
        }
        
        // Cargar programa asignado
        const programResponse = await fetch(`${API_URL}/api/programs/my-program/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (programResponse.ok) {
          const programData = await programResponse.json();
          setUserProgram(programData);
        } else if (programResponse.status !== 404) {
          // Solo mostrar error si no es un 404 (programa no encontrado)
          const errorText = await programResponse.text();
          console.error("Error al cargar programa:", errorText);
          setError("Ocurrió un error al cargar tu programa. Por favor, intenta más tarde.");
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos de tu programa. Por favor, intenta más tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndLoadData();
  }, [navigation]);

  // Función para navegar a diferentes secciones
  const navigateTo = (route: keyof RootStackParamList) => {
    // Solo verifica si la ruta existe, sin usar Object.keys(RootStackParamList)
    try {
      navigation.navigate(route);
    } catch (error) {
      console.log(`La ruta ${route} aún no está implementada`, error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <HeaderComponent />
      
      {/* Contenido principal */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo personalizado */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>¡Hola, {userName}!</Text>
          <Text style={styles.greetingSubtitle}>
            Bienvenido a tu programa personalizado
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0077B6" />
            <Text style={styles.loadingText}>Cargando tu programa...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#d32f2f" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : !userProgram ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0077B6" />
            <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
          </View>
        ) : (
          /* Programa asignado */
          <View style={styles.programContainer}>
            <LinearGradient
              colors={programColors[userProgram.program.type] || ['#0077B6', '#00B4D8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.programHeader}
            >
              <View style={styles.programTitleContainer}>
                <Ionicons name="rocket-outline" size={30} color="#ffffff" />
                <Text style={styles.programTitle}>Tu Programa</Text>
              </View>
              <Text style={styles.programName}>{userProgram.program.name}</Text>
            </LinearGradient>
            
            <View style={styles.programContent}>
              <Text style={styles.programDescription}>
                {programDescriptions[userProgram.program.type] || 
                 'Este programa ha sido personalizado según tus respuestas a los cuestionarios.'}
              </Text>
              
              <View style={styles.programInfoBox}>
                <Ionicons name="information-circle-outline" size={24} color="#0077B6" />
                <Text style={styles.programInfoText}>
                  Este programa ha sido asignado basado en tus respuestas a los cuestionarios GerdQ y RSI.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.startProgramButton}
                onPress={() => Alert.alert('Programa en desarrollo', 'Estamos preparando los detalles de tu programa. Pronto estará disponible con todas las recomendaciones personalizadas.')}
              >
                <Text style={styles.startProgramButtonText}>Ver Detalles del Programa</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Sección Próximamente */}
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonTitle}>Próximamente</Text>
          <Text style={styles.comingSoonText}>
            Estamos trabajando en nuevas funcionalidades para mejorar tu experiencia y ayudarte a gestionar mejor tu salud digestiva. Pronto podrás acceder a:
          </Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="calendar-outline" size={22} color="#0077B6" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Seguimiento diario</Text>
              <Text style={styles.featureDescription}>Registra tus síntomas, alimentos y medicamentos para identificar patrones.</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="book-outline" size={22} color="#0077B6" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Planes de alimentación</Text>
              <Text style={styles.featureDescription}>Recomendaciones dietéticas personalizadas para tu condición.</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles-outline" size={22} color="#0077B6" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Asistente virtual</Text>
              <Text style={styles.featureDescription}>Consultas y recordatorios para ayudarte a seguir tu tratamiento.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, styles.activeTab]}
        >
          <Ionicons name="home" size={24} color="#0077B6" />
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => Alert.alert('Próximamente', 'Esta sección estará disponible pronto.')}
        >
          <Ionicons name="calendar-outline" size={24} color="#666666" />
          <Text style={styles.tabLabelInactive}>Tracker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => Alert.alert('Próximamente', 'Esta sección estará disponible pronto.')}
        >
          <Ionicons name="analytics-outline" size={24} color="#666666" />
          <Text style={styles.tabLabelInactive}>Estadísticas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => Alert.alert('Próximamente', 'Esta sección estará disponible pronto.')}
        >
          <Ionicons name="person-outline" size={24} color="#666666" />
          <Text style={styles.tabLabelInactive}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6F7FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#005f73',
  },
  greetingSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
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
  programContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  programHeader: {
    padding: 20,
  },
  programTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  programName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  programContent: {
    padding: 20,
  },
  programDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  programInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#E6F7FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  programInfoText: {
    fontSize: 14,
    color: '#0077B6',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  startProgramButton: {
    backgroundColor: '#0077B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  startProgramButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  // Sección de proximamente
  comingSoonContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIcon: {
    backgroundColor: '#E6F7FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    paddingTop: 8,
    paddingLeft: 9,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#005f73',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0077B6',
    paddingBottom: 5,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#0077B6',
    fontWeight: 'bold',
  },
  tabLabelInactive: {
    fontSize: 12,
    marginTop: 4,
    color: '#666666',
  },
});