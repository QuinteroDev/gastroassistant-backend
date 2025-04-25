// screens/TrackerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import HeaderComponent from '../components/HeaderComponent';

type TrackerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tracker'>;

const { width } = Dimensions.get('window');

// Componente para selección de fecha con calendario visual
const DateSelector = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  // Función para formatear la fecha
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };
  
  // Función para cambiar el día
  const changeDay = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Genera los días de la semana para la vista de calendario
  const generateWeekDays = () => {
    const currentDate = new Date(selectedDate);
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando el día es domingo
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const weekDays = generateWeekDays();
  
  return (
    <View style={styles.dateContainer}>
      {/* Fecha principal con flechas de navegación */}
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => changeDay(-1)}
        >
          <Ionicons name="chevron-back" size={24} color="#0077B6" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateTouchable}
          onPress={() => setCalendarVisible(!calendarVisible)}
        >
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Ionicons name={calendarVisible ? "chevron-up" : "chevron-down"} size={16} color="#0077B6" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => changeDay(1)}
        >
          <Ionicons name="chevron-forward" size={24} color="#0077B6" />
        </TouchableOpacity>
      </View>
      
      {/* Vista de calendario de la semana */}
      {calendarVisible && (
        <View style={styles.calendarView}>
          <View style={styles.weekDaysContainer}>
            {weekDays.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 2);
              const dayNumber = date.getDate();
              
              return (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.weekDay,
                    isSelected ? styles.selectedWeekDay : {}
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.weekDayName, isSelected ? styles.selectedWeekDayText : {}]}>
                    {dayName}
                  </Text>
                  <Text style={[styles.weekDayNumber, isSelected ? styles.selectedWeekDayText : {}]}>
                    {dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

// Componente para el slider de intensidad
const IntensitySlider = () => {
  const [intensity, setIntensity] = useState(1);
  
  return (
    <View style={styles.intensityContainer}>
      <Text style={styles.intensityTitle}>Intensidad de los síntomas</Text>
      
      <View style={styles.sliderContainer}>
        <TouchableOpacity 
          style={[styles.intensityOption, intensity === 1 ? styles.intensitySelected : {}]}
          onPress={() => setIntensity(1)}
        >
          <Text style={[styles.intensityText, intensity === 1 ? styles.intensitySelectedText : {}]}>1</Text>
          <Text style={styles.intensityLabel}>Leve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.intensityOption, intensity === 2 ? styles.intensitySelected : {}]}
          onPress={() => setIntensity(2)}
        >
          <Text style={[styles.intensityText, intensity === 2 ? styles.intensitySelectedText : {}]}>2</Text>
          <Text style={styles.intensityLabel}>Moderado</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.intensityOption, intensity === 3 ? styles.intensitySelected : {}]}
          onPress={() => setIntensity(3)}
        >
          <Text style={[styles.intensityText, intensity === 3 ? styles.intensitySelectedText : {}]}>3</Text>
          <Text style={styles.intensityLabel}>Intenso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TrackerScreen() {
  const navigation = useNavigation<TrackerScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [notes, setNotes] = useState('');

  // Lista de síntomas disponibles
  const symptoms = [
    { id: 1, name: 'Acidez', icon: 'flame-outline', color: '#FF6B6B' },
    { id: 2, name: 'Regurgitación', icon: 'water-outline', color: '#0096C7' },
    { id: 3, name: 'Dolor', icon: 'medical-outline', color: '#FF9F1C' },
    { id: 4, name: 'Insomnio', icon: 'bed-outline', color: '#6C757D' },
    { id: 5, name: 'Tos', icon: 'fitness-outline', color: '#4CAF50' },
    { id: 6, name: 'Náuseas', icon: 'medical-outline', color: '#9C27B0' },
  ];

  // Lista de comidas para registrar
  const meals = [
    { id: 1, name: 'Desayuno', icon: 'sunny-outline', color: '#FF9F1C' },
    { id: 2, name: 'Almuerzo', icon: 'restaurant-outline', color: '#0077B6' },
    { id: 3, name: 'Cena', icon: 'moon-outline', color: '#6F42C1' },
    { id: 4, name: 'Snack', icon: 'cafe-outline', color: '#28A745' },
  ];

  // Animación para el botón de guardar
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en TrackerScreen...");
      const token = await SecureStore.getItemAsync('authToken');
      console.log("Token en TrackerScreen:", token ? "Existe" : "No existe");
      
      if (!token) {
        console.log("No hay token, redirigiendo a Login...");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    
    checkAuth();
  }, [navigation]);

  // Manejar la selección de síntomas
  const toggleSymptom = (symptomId) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(id => id !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  // Manejar la selección de comidas
  const toggleMeal = (mealId) => {
    if (selectedMeals.includes(mealId)) {
      setSelectedMeals(selectedMeals.filter(id => id !== mealId));
    } else {
      setSelectedMeals([...selectedMeals, mealId]);
    }
  };

  // Manejar el guardado del registro
  const saveRecord = () => {
    animateButton();
    setIsLoading(true);
    
    // Simular un tiempo de guardado
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Registro guardado", 
        "Tu registro diario ha sido guardado correctamente.",
        [{ text: "OK", onPress: () => navigation.navigate('Home') }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Usamos el HeaderComponent con botón de retroceso */}
      <HeaderComponent 
        showBackButton={true} 
        onBackPress={() => navigation.navigate('Home')}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mi Registro Diario</Text>
        
        <DateSelector />
        
        {/* Tarjeta de resumen rápido */}
        <View style={styles.quickSummaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics-outline" size={22} color="#0077B6" />
            <Text style={styles.summaryTitle}>Resumen rápido</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#E6F7FF' }]}>
                <Ionicons name="medical-outline" size={18} color="#0077B6" />
              </View>
              <Text style={styles.summaryText}>
                {selectedSymptoms.length === 0 ? 
                  "No has reportado síntomas hoy" : 
                  `${selectedSymptoms.length} síntoma(s) reportado(s)`
                }
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#E6F7FF' }]}>
                <Ionicons name="restaurant-outline" size={18} color="#0077B6" />
              </View>
              <Text style={styles.summaryText}>
                {selectedMeals.length === 0 ? 
                  "No has registrado comidas hoy" : 
                  `${selectedMeals.length} comida(s) registrada(s)`
                }
              </Text>
            </View>
          </View>
        </View>
        
        {/* Sección de síntomas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Síntomas</Text>
            <Text style={styles.sectionSubtitle}>Selecciona los síntomas que has experimentado hoy</Text>
          </View>
          
          <View style={styles.symptomGrid}>
            {symptoms.map((symptom) => (
              <TouchableOpacity 
                key={symptom.id} 
                style={[
                  styles.symptomButton,
                  selectedSymptoms.includes(symptom.id) ? {
                    backgroundColor: symptom.color + '20',
                    borderColor: symptom.color
                  } : {}
                ]}
                onPress={() => toggleSymptom(symptom.id)}
              >
                <View style={[
                  styles.symptomIcon, 
                  { backgroundColor: selectedSymptoms.includes(symptom.id) ? symptom.color : '#f1f1f1' }
                ]}>
                  <Ionicons 
                    name={symptom.icon} 
                    size={22} 
                    color={selectedSymptoms.includes(symptom.id) ? '#ffffff' : '#757575'} 
                  />
                </View>
                <Text style={[
                  styles.symptomText,
                  selectedSymptoms.includes(symptom.id) ? { color: symptom.color, fontWeight: '500' } : {}
                ]}>
                  {symptom.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Componente de intensidad de síntomas */}
        {selectedSymptoms.length > 0 && <IntensitySlider />}
        
        {/* Sección de comidas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Comidas</Text>
            <Text style={styles.sectionSubtitle}>Selecciona las comidas que has realizado hoy</Text>
          </View>
          
          <View style={styles.mealsContainer}>
            {meals.map((meal) => (
              <TouchableOpacity 
                key={meal.id} 
                style={[
                  styles.mealButton,
                  selectedMeals.includes(meal.id) ? {
                    backgroundColor: meal.color + '20',
                    borderColor: meal.color
                  } : {}
                ]}
                onPress={() => toggleMeal(meal.id)}
              >
                <View style={[
                  styles.mealIcon, 
                  { backgroundColor: selectedMeals.includes(meal.id) ? meal.color : '#f1f1f1' }
                ]}>
                  <Ionicons 
                    name={meal.icon} 
                    size={22} 
                    color={selectedMeals.includes(meal.id) ? '#ffffff' : '#757575'} 
                  />
                </View>
                <Text style={[
                  styles.mealText,
                  selectedMeals.includes(meal.id) ? { color: meal.color, fontWeight: '500' } : {}
                ]}>
                  {meal.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Sección de notas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notas adicionales</Text>
            <Text style={styles.sectionSubtitle}>Añade cualquier observación relevante</Text>
          </View>
          
          <TextInput
            style={styles.notesInput}
            multiline={true}
            numberOfLines={4}
            placeholder="Escribe aquí tus notas... (opcional)"
            placeholderTextColor="#aaa"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
        
        {/* Botón para guardar el registro */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveRecord}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#ffffff" style={styles.saveIcon} />
                <Text style={styles.saveButtonText}>Guardar Registro</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#0077B6" />
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, styles.activeTab]}
        >
          <Ionicons name="calendar" size={24} color="#0077B6" />
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
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#005f73',
    marginVertical: 16,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  dateTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginRight: 5,
    textAlign: 'center',
  },
  calendarView: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weekDay: {
    alignItems: 'center',
    width: (width - 80) / 7,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedWeekDay: {
    backgroundColor: '#0077B6',
  },
  weekDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedWeekDayText: {
    color: '#fff',
  },
  quickSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077B6',
    marginLeft: 8,
  },
  summaryContent: {
    marginTop: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  symptomButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
  },
  symptomIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  symptomText: {
    color: '#495057',
    fontSize: 14,
    flex: 1,
  },
  intensityContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  intensityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  intensitySelected: {
    backgroundColor: '#0077B620',
    borderColor: '#0077B6',
  },
  intensityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  intensitySelectedText: {
    color: '#0077B6',
  },
  intensityLabel: {
    fontSize: 12,
    color: '#777',
  },
  mealsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mealText: {
    color: '#495057',
    fontSize: 14,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0077B6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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