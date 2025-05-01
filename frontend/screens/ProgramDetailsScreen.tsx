// screens/ProgramDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { getData } from '../utils/storage';

type ProgramDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProgramDetails'>;

// Colores para cada tipo de programa
const programColors = {
  'A': ['#0077B6', '#00B4D8'], // GerdQ y RSI positivos
  'B': ['#0096C7', '#48CAE4'], // GerdQ positivo, RSI negativo
  'C': ['#023E8A', '#0077B6'], // GerdQ negativo, RSI positivo
  'D': ['#03045E', '#023E8A']  // GerdQ y RSI negativos
};

// Interfaz para recomendaciones
interface Recommendation {
  id: number;
  title: string;
  content: string;
  tools?: string;
  type?: string;
  is_read?: boolean;
  is_prioritized?: boolean;
}

export default function ProgramDetailsScreen() {
  const navigation = useNavigation<ProgramDetailsNavigationProp>();
  const [userProgram, setUserProgram] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [priorityRecommendations, setPriorityRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);
  
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
        // Cargar el programa asignado
        const programResponse = await api.get('/api/programs/my-program/');
        
        if (programResponse.data) {
          console.log("Programa cargado:", programResponse.data);
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
      } catch (err) {
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
  
  // Renderizar una recomendación
  const renderRecommendation = (item: Recommendation, isPriority: boolean = false) => {
    const isExpanded = expandedRecommendation === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.recommendationCard,
          isPriority && styles.priorityCard,
          isExpanded && styles.expandedCard
        ]}
        onPress={() => toggleRecommendation(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.recommendationHeader}>
          {isPriority && (
            <View style={styles.priorityBadge}>
              <Ionicons name="star" size={14} color="#ffffff" />
              <Text style={styles.priorityText}>Prioridad</Text>
            </View>
          )}
          
          <Text 
            style={[
              styles.recommendationTitle, 
              !item.is_read && styles.unreadTitle
            ]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.title}
          </Text>
          
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#0077B6" 
          />
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.recommendationContent}>
              {item.content}
            </Text>
            
            {item.tools && (
              <View style={styles.toolsSection}>
                <Text style={styles.toolsTitle}>Herramientas sugeridas:</Text>
                <Text style={styles.toolsContent}>{item.tools}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <HeaderComponent />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando detalles del programa...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.retryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      ) : !userProgram ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Programa no encontrado</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.retryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Cabecera del programa */}
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
          
          {/* Recomendaciones prioritarias */}
          {priorityRecommendations.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recomendaciones Prioritarias</Text>
              <Text style={styles.sectionDescription}>
                Estas son las recomendaciones más importantes para tu caso particular.
              </Text>
              
              {priorityRecommendations.map(recommendation => 
                renderRecommendation(recommendation, true)
              )}
            </View>
          )}
          
          {/* Todas las recomendaciones */}
          {recommendations.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Todas las Recomendaciones</Text>
              
              {recommendations
                .filter(rec => !priorityRecommendations.some(pr => pr.id === rec.id))
                .map(recommendation => renderRecommendation(recommendation))
              }
            </View>
          )}
          
          {/* Iniciar seguimiento */}
          <View style={styles.trackerSection}>
            <Text style={styles.trackerTitle}>Seguimiento de Hábitos</Text>
            <Text style={styles.trackerDescription}>
              Inicia el seguimiento de tus hábitos y síntomas para mejorar
              tu condición y recibir recomendaciones más personalizadas.
            </Text>
            
            <TouchableOpacity
              style={styles.startTrackerButton}
              onPress={() => navigation.navigate('Tracker')}
            >
              <Text style={styles.buttonText}>Iniciar Seguimiento</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
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
  programHeader: {
    padding: 20,
    marginBottom: 16,
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
  sectionContainer: {
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
  },
  expandedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077B6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 10,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#005f73',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recommendationContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  toolsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 6,
  },
  toolsContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  trackerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trackerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 8,
  },
  trackerDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  startTrackerButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
});