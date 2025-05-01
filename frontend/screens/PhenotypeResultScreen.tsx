// screens/PhenotypeResultScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { getData } from '../utils/storage';

type PhenotypeResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhenotypeResult'>;

// Interfaz para datos del fenotipo
interface PhenotypeData {
  phenotype_code: string;
  phenotype_display: string;
  scenario: string;
  recommendations: string[];
  has_complete_data: boolean;
}

// Colores para los fenotipos
const phenotypeColors = {
  'EROSIVE': '#d32f2f',
  'NERD': '#ff9800',
  'EXTRAESOPHAGEAL': '#4caf50',
  'FUNCTIONAL': '#2196f3',
  'SYMPTOMS_NO_TESTS': '#9e9e9e',
  'EXTRAESOPHAGEAL_NO_TESTS': '#8bc34a',
  'NO_SYMPTOMS': '#03a9f4',
  'UNDETERMINED': '#757575'
};

// Iconos para los fenotipos
const phenotypeIcons = {
  'EROSIVE': 'flame-outline',
  'NERD': 'alert-circle-outline',
  'EXTRAESOPHAGEAL': 'medical-outline',
  'FUNCTIONAL': 'pulse-outline',
  'SYMPTOMS_NO_TESTS': 'help-circle-outline',
  'EXTRAESOPHAGEAL_NO_TESTS': 'help-buoy-outline',
  'NO_SYMPTOMS': 'checkmark-circle-outline',
  'UNDETERMINED': 'help-circle-outline'
};

export default function PhenotypeResultScreen() {
  const navigation = useNavigation<PhenotypeResultNavigationProp>();
  const [phenotypeData, setPhenotypeData] = useState<PhenotypeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar token y cargar datos
  useEffect(() => {
    const fetchPhenotypeData = async () => {
      setIsLoading(true);
      setError(null);
      
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
        console.log("Obteniendo datos de fenotipo...");
        const response = await api.get('/api/profiles/phenotype/');
        
        console.log("Datos de fenotipo recibidos:", response.data);
        setPhenotypeData(response.data);
      } catch (err) {
        console.error("Error al cargar datos de fenotipo:", err);
        let message = "Error al cargar tu perfil ERGE";
        
        if (err.response && err.response.status === 401) {
          message = "Sesión expirada. Por favor inicia sesión nuevamente.";
          
          Alert.alert(
            "Sesión expirada",
            message,
            [{ text: "Ir a Login", onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }}]
          );
        } else {
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPhenotypeData();
  }, [navigation]);
  
  // Continuar al generador de programa
  const handleContinue = () => {
    navigation.navigate('GeneratingProgram');
  };
  
  // Obtener el color del fenotipo o un valor por defecto
  const getPhenotypeColor = (code: string): string => {
    return phenotypeColors[code] || '#0077B6';
  };
  
  // Obtener el icono del fenotipo o un valor por defecto
  const getPhenotypeIcon = (code: string): string => {
    return phenotypeIcons[code] || 'help-circle-outline';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <HeaderComponent />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Analizando tu perfil ERGE...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: 'PhenotypeResult' }],
            })}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !phenotypeData ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No se pudo obtener tu perfil ERGE</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Tu Perfil ERGE</Text>
            
            {/* Tarjeta del fenotipo */}
            <View style={[
              styles.phenotypeCard,
              { borderColor: getPhenotypeColor(phenotypeData.phenotype_code) }
            ]}>
              <View style={[
                styles.phenotypeIconContainer,
                { backgroundColor: getPhenotypeColor(phenotypeData.phenotype_code) }
              ]}>
                <Ionicons 
                  name={getPhenotypeIcon(phenotypeData.phenotype_code) as any} 
                  size={32} 
                  color="#fff" 
                />
              </View>
              
              <Text style={styles.phenotypeTitle}>
                {phenotypeData.phenotype_display}
              </Text>
              
              {phenotypeData.scenario && (
                <View style={styles.scenarioContainer}>
                  <Text style={styles.scenarioLabel}>Escenario:</Text>
                  <Text style={styles.scenarioValue}>{phenotypeData.scenario}</Text>
                </View>
              )}
              
              <Text style={styles.phenotypeDescription}>
                {phenotypeData.phenotype_code === 'UNDETERMINED' ? 
                  "Según tus respuestas, aún no podemos determinar con precisión tu perfil ERGE. Esto puede deberse a que faltan datos o a que tus síntomas no corresponden claramente a un fenotipo específico." :
                  "Basado en tus respuestas a los cuestionarios y la información médica proporcionada, hemos identificado tu perfil ERGE. Este perfil nos ayuda a personalizar las recomendaciones para tu caso específico."
                }
              </Text>
            </View>
            
            {/* Recomendaciones */}
            {phenotypeData.recommendations && phenotypeData.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.recommendationsTitle}>Recomendaciones Principales</Text>
                
                {phenotypeData.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#0077B6" style={styles.checkIcon} />
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Información adicional */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#0077B6" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {phenotypeData.has_complete_data ? 
                  "Este perfil está basado en todos los datos necesarios. Para obtener recomendaciones más personalizadas, continúa al siguiente paso." :
                  "Este perfil es preliminar ya que faltan algunos datos importantes. Para un análisis más preciso, considera completar la información médica faltante o consultar con un especialista."
                }
              </Text>
            </View>
            
            {/* Botón de continuar */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                Continuar a Mi Programa
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#005f73',
  },
  phenotypeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    borderLeftWidth: 6,
    alignItems: 'center',
  },
  phenotypeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  phenotypeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  scenarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scenarioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  scenarioValue: {
    fontSize: 16,
    color: '#0077B6',
    fontWeight: 'bold',
  },
  phenotypeDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  checkIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E6F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#0077B6',
    flex: 1,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
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
});