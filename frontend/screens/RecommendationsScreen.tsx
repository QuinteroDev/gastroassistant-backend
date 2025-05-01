// screens/RecommendationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { getData } from '../utils/storage';
import CustomButton from '../components/CustomButton';
import HeaderComponent from '../components/HeaderComponent';

type RecommendationsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Recommendations'>;

interface Recommendation {
  id: number;
  recommendation: {
    id: number;
    title: string;
    content: string;
    tools: string;
    recommendation_type: {
      type: string;
      name: string;
    }
  };
  is_read: boolean;
  is_prioritized: boolean;
}

export default function RecommendationsScreen() {
  const navigation = useNavigation<RecommendationsNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [prioritizedRecommendations, setPrioritizedRecommendations] = useState<Recommendation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'prioritized' | 'all'>('prioritized');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Cargar todas las recomendaciones
      const allResponse = await api.get('/api/recommendations/');
      setRecommendations(allResponse.data);
      
      // Cargar recomendaciones prioritarias
      const prioritizedResponse = await api.get('/api/recommendations/prioritized/');
      setPrioritizedRecommendations(prioritizedResponse.data);
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
      setError('No se pudieron cargar las recomendaciones. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateRecommendations = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/recommendations/regenerate/');
      await loadRecommendations();
    } catch (error) {
      console.error('Error al regenerar recomendaciones:', error);
      setError('No se pudieron regenerar las recomendaciones. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (recommendationId: number) => {
    try {
      await api.patch(`/api/recommendations/${recommendationId}/`, {
        is_read: true
      });
      
      // Actualizar el estado local
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId ? { ...rec, is_read: true } : rec
        )
      );
      
      setPrioritizedRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId ? { ...rec, is_read: true } : rec
        )
      );
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  // Obtener el ícono según el tipo de recomendación
  const getIconForType = (type: string) => {
    switch (type) {
      case 'BMI':
        return 'body-outline';
      case 'HERNIA':
        return 'ellipse-outline';
      case 'MOTILITY':
        return 'git-branch-outline';
      case 'EMPTYING':
        return 'hourglass-outline';
      case 'SALIVA':
        return 'water-outline';
      case 'CONSTIPATION':
        return 'fitness-outline';
      case 'STRESS':
        return 'pulse-outline';
      case 'PHENOTYPE':
        return 'medical-outline';
      case 'HABIT':
        return 'nutrition-outline';
      default:
        return 'information-circle-outline';
    }
  };

  // Obtener color según el tipo de recomendación
  const getColorForType = (type: string) => {
    switch (type) {
      case 'BMI':
        return '#0096C7';
      case 'HERNIA':
        return '#0077B6';
      case 'MOTILITY':
        return '#023E8A';
      case 'EMPTYING':
        return '#0096C7';
      case 'SALIVA':
        return '#0077B6';
      case 'CONSTIPATION':
        return '#023E8A';
      case 'STRESS':
        return '#0096C7';
      case 'PHENOTYPE':
        return '#0077B6';
      case 'HABIT':
        return '#023E8A';
      default:
        return '#0077B6';
    }
  };

  const renderRecommendationCard = (rec: Recommendation) => {
    const type = rec.recommendation.recommendation_type.type;
    const icon = getIconForType(type);
    const color = getColorForType(type);
    
    return (
      <TouchableOpacity 
        key={rec.id} 
        style={[
          styles.recommendationCard,
          rec.is_read && styles.readRecommendation
        ]}
        onPress={() => markAsRead(rec.id)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: color }]}>
            <Ionicons name={icon} size={20} color="#FFFFFF" />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.recommendationTitle}>{rec.recommendation.title}</Text>
            <Text style={styles.recommendationType}>
              {rec.recommendation.recommendation_type.name}
            </Text>
          </View>
          
          {rec.is_prioritized && (
            <View style={styles.priorityBadge}>
              <Ionicons name="star" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        <Text style={styles.recommendationContent}>
          {rec.recommendation.content}
        </Text>
        
        {rec.recommendation.tools && (
          <View style={styles.toolsContainer}>
            <Text style={styles.toolsTitle}>Herramientas sugeridas:</Text>
            {rec.recommendation.tools.split(',').map((tool, index) => (
              <View key={index} style={styles.toolItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0077B6" />
                <Text style={styles.toolText}>{tool.trim()}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.cardFooter}>
          {!rec.is_read ? (
            <Text style={styles.statusText}>Toca para marcar como leído</Text>
          ) : (
            <Text style={styles.readStatusText}>Leído</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077B6" />
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <HeaderComponent showBackButton={true} />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'prioritized' && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab('prioritized')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'prioritized' && styles.activeTabText
            ]}
          >
            Prioritarias
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'all' && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'all' && styles.activeTabText
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#D8000C" />
            <Text style={styles.errorText}>{error}</Text>
            <CustomButton 
              title="Intentar de nuevo" 
              onPress={loadRecommendations} 
              type="primary"
              size="medium"
            />
          </View>
        ) : (
          <>
            {selectedTab === 'prioritized' ? (
              prioritizedRecommendations.length > 0 ? (
                prioritizedRecommendations.map(renderRecommendationCard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="star-outline" size={60} color="#0077B6" />
                  <Text style={styles.emptyText}>
                    No tienes recomendaciones prioritarias en este momento.
                  </Text>
                </View>
              )
            ) : (
              recommendations.length > 0 ? (
                recommendations.map(renderRecommendationCard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={60} color="#0077B6" />
                  <Text style={styles.emptyText}>
                    No hay recomendaciones disponibles. Actualiza tu perfil para recibir recomendaciones personalizadas.
                  </Text>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <CustomButton
          title="Regenerar Recomendaciones"
          onPress={handleRegenerateRecommendations}
          icon="refresh"
          iconPosition="left"
          type="outline"
          size="medium"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7EE',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0077B6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0077B6',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0077B6',
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D8000C',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  readRecommendation: {
    opacity: 0.7,
    backgroundColor: '#F9F9F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  recommendationType: {
    fontSize: 14,
    color: '#666',
  },
  priorityBadge: {
    backgroundColor: '#FFA000',
    borderRadius: 12,
    padding: 4,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  toolsContainer: {
    backgroundColor: '#F5F8FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  toolText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#0077B6',
    fontStyle: 'italic',
  },
  readStatusText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E7EE',
  },
});