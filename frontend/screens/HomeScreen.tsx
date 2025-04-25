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
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import HeaderComponent from '../components/HeaderComponent';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Array de consejos sobre gastritis y reflujo
const healthTips = [
  {
    title: "¿Qué es el reflujo gastroesofágico?",
    content: "El reflujo gastroesofágico (ERGE) es una afección digestiva en la que el ácido del estómago vuelve al esófago. Esto puede causar irritación del revestimiento del esófago, causando síntomas como acidez, regurgitación, dificultad para tragar y sensación de que hay un bulto en la garganta.",
    icon: "medical-outline"
  },
  {
    title: "Consejos para manejar el reflujo",
    content: "Mantén un peso saludable, come porciones más pequeñas, evita acostarte después de comer, eleva la cabecera de tu cama, evita alimentos que desencadenen el reflujo (como alimentos grasos o picantes, chocolate, menta, café y alcohol) y deja de fumar si fumas.",
    icon: "leaf-outline"
  },
  {
    title: "Signos de alerta de gastritis",
    content: "La gastritis puede manifestarse con dolor abdominal, náuseas, vómitos, sensación de llenura, acidez estomacal o pérdida de apetito. Si experimentas sangrado digestivo (heces negras o vómito con sangre), dolor intenso o persistente, debes buscar atención médica inmediata.",
    icon: "warning-outline"
  }
];

// Acciones rápidas para la pantalla principal
const quickActions = [
  {
    title: "Registrar síntomas",
    icon: "clipboard-outline",
    color: "#00B4D8",
    route: "Tracker"
  },
  {
    title: "Consejos dietéticos",
    icon: "nutrition-outline",
    color: "#0096C7",
    route: "Diet"
  },
  {
    title: "Medicamentos",
    icon: "medical-outline",
    color: "#0077B6",
    route: "Medications"
  },
  {
    title: "Mi perfil",
    icon: "person-outline",
    color: "#023E8A",
    route: "Profile"
  }
];

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [selectedTip, setSelectedTip] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [userName, setUserName] = useState("Usuario");

  // Efecto de desvanecimiento para los consejos
  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedTip(prev => (prev + 1) % healthTips.length);
      fadeIn();
    });
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en HomeScreen...");
      const token = await SecureStore.getItemAsync('authToken');
      console.log("Token en HomeScreen:", token ? "Existe" : "No existe");
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
      
      // Simulamos obtener el nombre del usuario (en una app real esto vendría del backend)
      setUserName("María");
    };
    
    checkAuth();

    // Cambiar el consejo cada 30 segundos con animación
    const interval = setInterval(() => {
      fadeOut();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigation]);

  // Función para navegar a diferentes secciones
  const navigateTo = (route: keyof RootStackParamList) => {
    if (Object.keys(RootStackParamList).includes(route)) {
      navigation.navigate(route);
    } else {
      console.log(`La ruta ${route} aún no está implementada`);
      // Aquí podrías mostrar un mensaje al usuario
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
            ¿Cómo te sientes hoy?
          </Text>
          
          {/* Selector de estado de ánimo */}
          <View style={styles.moodSelector}>
            <TouchableOpacity style={styles.moodItem}>
              <View style={[styles.moodIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="happy-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.moodText}>Bien</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodItem}>
              <View style={[styles.moodIcon, { backgroundColor: '#FFC107' }]}>
                <Ionicons name="sad-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.moodText}>Regular</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodItem}>
              <View style={[styles.moodIcon, { backgroundColor: '#F44336' }]}>
                <Ionicons name="warning-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.moodText}>Mal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.actionItem}
                onPress={() => navigateTo(action.route as keyof RootStackParamList)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tarjeta de información con consejos */}
        <View style={styles.infoCardContainer}>
          <Text style={styles.sectionTitle}>Consejo del día</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoIconContainer}>
                <Ionicons 
                  name={healthTips[selectedTip].icon} 
                  size={24} 
                  color="#0077B6" 
                />
              </View>
              <Animated.Text 
                style={[styles.infoCardTitle, { opacity: fadeAnim }]}
              >
                {healthTips[selectedTip].title}
              </Animated.Text>
            </View>
            
            <Animated.Text 
              style={[styles.infoCardContent, { opacity: fadeAnim }]}
            >
              {healthTips[selectedTip].content}
            </Animated.Text>
            
            {/* Indicadores de página */}
            <View style={styles.dotsContainer}>
              {healthTips.map((_, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => {
                    fadeOut();
                    setTimeout(() => setSelectedTip(index), 200);
                  }}
                >
                  <View 
                    style={[
                      styles.dot, 
                      index === selectedTip ? styles.activeDot : {}
                    ]} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Resumen del seguimiento */}
        <View style={styles.trackingSummary}>
          <View style={styles.trackingHeader}>
            <Text style={styles.sectionTitle}>Tu progreso</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigateTo('Tracker')}
            >
              <Text style={styles.viewAllText}>Ver todo</Text>
              <Ionicons name="chevron-forward" size={16} color="#0077B6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressNumber}>7</Text>
                <Text style={styles.progressDays}>días</Text>
              </View>
              <Text style={styles.progressLabel}>Seguimiento</Text>
            </View>
            
            <View style={styles.progressDivider} />
            
            <View style={styles.progressItem}>
              <View style={[styles.progressCircle, { backgroundColor: '#CAF0F8' }]}>
                <Text style={[styles.progressNumber, { color: '#0077B6' }]}>3</Text>
                <Text style={[styles.progressDays, { color: '#0077B6' }]}>síntomas</Text>
              </View>
              <Text style={styles.progressLabel}>Última semana</Text>
            </View>
          </View>
        </View>
        
        {/* Consejo dietético destacado */}
        <View style={styles.dietTipContainer}>
          <View style={styles.dietTipHeader}>
            <Ionicons name="nutrition-outline" size={22} color="#0077B6" />
            <Text style={styles.dietTipTitle}>Consejo dietético</Text>
          </View>
          <Text style={styles.dietTipContent}>
            Las comidas ricas en grasas pueden empeorar el reflujo. Prueba hoy 
            alimentos más ligeros como verduras al vapor, pescado a la plancha 
            o avena con frutas.
          </Text>
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
          onPress={() => navigation.navigate('Tracker')}
        >
          <Ionicons name="calendar-outline" size={24} color="#0077B6" />
          <Text style={styles.tabLabel}>Tracker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="analytics-outline" size={24} color="#0077B6" />
          <Text style={styles.tabLabel}>Estadísticas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#0077B6" />
          <Text style={styles.tabLabel}>Perfil</Text>
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
    paddingBottom: 24,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
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
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  moodItem: {
    alignItems: 'center',
    width: (width - 80) / 3,
  },
  moodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  moodText: {
    fontSize: 14,
    color: '#555',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionItem: {
    width: (width - 50) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    flex: 1,
  },
  infoCardContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CAF0F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077B6',
    flex: 1,
  },
  infoCardContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
    minHeight: 110,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cccccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#0077B6',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trackingSummary: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#0077B6',
    fontSize: 14,
    marginRight: 4,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressDays: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: -2,
  },
  progressLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  progressDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  dietTipContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dietTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dietTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077B6',
    marginLeft: 8,
  },
  dietTipContent: {
    fontSize: 15,
    color: '#444',
    lineHeight: 21,
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
    paddingHorizontal: 12,
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
  },
});