// screens/OnboardingDiagnosticTestsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import api from '../utils/api';
import { getData } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

type OnboardingDiagnosticTestsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingDiagnosticTests'>;

// Interfaz para los datos del formulario
interface DiagnosticTestsData {
  has_endoscopy: boolean;
  endoscopy_result: string | null;
  has_ph_monitoring: boolean;
  ph_monitoring_result: string | null;
}

export default function OnboardingDiagnosticTestsScreen() {
  const navigation = useNavigation<OnboardingDiagnosticTestsNavigationProp>();
  
  // Estado del formulario
  const [hasEndoscopy, setHasEndoscopy] = useState<boolean>(false);
  const [endoscopyResult, setEndoscopyResult] = useState<string | null>(null);
  const [hasPHMonitoring, setHasPHMonitoring] = useState<boolean>(false);
  const [phMonitoringResult, setPHMonitoringResult] = useState<string | null>(null);
  
  // Estado de la UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingDiagnosticTestsScreen...");
      const token = await getData('authToken');
      
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

  // Opciones para resultados de endoscopia
  const endoscopyOptions = [
    { id: 'NORMAL', label: 'Normal (sin lesiones)' },
    { id: 'ESOPHAGITIS_A', label: 'Esofagitis Grado A (leve)' },
    { id: 'ESOPHAGITIS_B', label: 'Esofagitis Grado B (moderada)' },
    { id: 'ESOPHAGITIS_C', label: 'Esofagitis Grado C (severa)' },
    { id: 'ESOPHAGITIS_D', label: 'Esofagitis Grado D (muy severa)' },
    { id: 'UNKNOWN', label: 'No recuerdo el resultado' }
  ];

  // Opciones para resultados de pH-metría
  const phMonitoringOptions = [
    { id: 'POSITIVE', label: 'Positiva (confirma reflujo)' },
    { id: 'NEGATIVE', label: 'Negativa (no confirma reflujo)' },
    { id: 'UNKNOWN', label: 'No recuerdo el resultado' }
  ];

  // Enviar datos
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Verificar que los resultados estén seleccionados si las pruebas están marcadas
      if (hasEndoscopy && !endoscopyResult) {
        setError('Por favor, selecciona el resultado de la endoscopia');
        setIsSubmitting(false);
        return;
      }

      if (hasPHMonitoring && !phMonitoringResult) {
        setError('Por favor, selecciona el resultado de la pH-metría');
        setIsSubmitting(false);
        return;
      }

      // Preparar datos para enviar
      const diagnosticData: DiagnosticTestsData = {
        has_endoscopy: hasEndoscopy,
        endoscopy_result: hasEndoscopy ? endoscopyResult : 'NOT_DONE',
        has_ph_monitoring: hasPHMonitoring,
        ph_monitoring_result: hasPHMonitoring ? phMonitoringResult : 'NOT_DONE'
      };

      console.log("Enviando datos de pruebas diagnósticas:", diagnosticData);
      
      // Enviar datos al servidor
      const response = await api.put('/api/profiles/tests/update/', diagnosticData);
      
      console.log("Datos de pruebas diagnósticas enviados correctamente:", response.data);
      
      // Verificar si hay un fenotipo determinado en la respuesta
      const phenotype = response.data.phenotype_result?.phenotype;
      
      // Navegar a la pantalla de resultado de fenotipo o a la siguiente en el flujo
      if (phenotype && phenotype !== 'UNDETERMINED') {
        navigation.navigate('OnboardingHabits');
      } else {
        // En caso de que no haya un fenotipo determinado, seguir con el flujo de onboarding
        Alert.alert(
          "Información Registrada",
          "Tus datos sobre pruebas diagnósticas han sido guardados correctamente.",
          [
            { 
              text: "Continuar", 
              onPress: () => {
                // Navegar a la pantalla de hábitos (según el orden del welcome screen)
                navigation.navigate('OnboardingHabits');
              }
            }
          ]
        );
      }
    } catch (err) {
      console.error("Error al enviar datos de pruebas diagnósticas:", err);
      let message = "Error al guardar los datos de pruebas diagnósticas";
      
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
      } else if (err.response && err.response.data && err.response.data.detail) {
        message = err.response.data.detail;
        Alert.alert("Error", message);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
           <HeaderComponent 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Pruebas Diagnósticas</Text>
            
            <Text style={styles.description}>
              Indica si te han realizado alguna de estas pruebas diagnósticas y cuál fue el resultado.
              Esta información es importante para determinar tu perfil ERGE.
            </Text>
            
            {/* Sección Endoscopia */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Endoscopia Digestiva Alta</Text>
                <Switch
                  trackColor={{ false: "#E0E0E0", true: "#90E0EF" }}
                  thumbColor={hasEndoscopy ? "#0077B6" : "#f4f3f4"}
                  onValueChange={setHasEndoscopy}
                  value={hasEndoscopy}
                />
              </View>
              
              <Text style={styles.sectionDescription}>
                La endoscopia es un procedimiento donde un tubo con cámara examina el esófago y estómago.
                Es útil para detectar lesiones o inflamación.
              </Text>
              
              {hasEndoscopy && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>¿Cuál fue el resultado?</Text>
                  
                  {endoscopyOptions.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        endoscopyResult === option.id && styles.selectedOption
                      ]}
                      onPress={() => setEndoscopyResult(option.id)}
                    >
                      <View style={styles.optionRow}>
                        <View style={styles.radioContainer}>
                          <View style={styles.radioOuter}>
                            {endoscopyResult === option.id && 
                              <View style={styles.radioInner} />
                            }
                          </View>
                        </View>
                        <Text style={[
                          styles.optionText,
                          endoscopyResult === option.id && styles.selectedOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Sección pH-metría */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>pH-metría o Impedanciometría</Text>
                <Switch
                  trackColor={{ false: "#E0E0E0", true: "#90E0EF" }}
                  thumbColor={hasPHMonitoring ? "#0077B6" : "#f4f3f4"}
                  onValueChange={setHasPHMonitoring}
                  value={hasPHMonitoring}
                />
              </View>
              
              <Text style={styles.sectionDescription}>
                La pH-metría mide el nivel de acidez en el esófago durante 24 horas.
                Ayuda a determinar si hay reflujo ácido.
              </Text>
              
              {hasPHMonitoring && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>¿Cuál fue el resultado?</Text>
                  
                  {phMonitoringOptions.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        phMonitoringResult === option.id && styles.selectedOption
                      ]}
                      onPress={() => setPHMonitoringResult(option.id)}
                    >
                      <View style={styles.optionRow}>
                        <View style={styles.radioContainer}>
                          <View style={styles.radioOuter}>
                            {phMonitoringResult === option.id && 
                              <View style={styles.radioInner} />
                            }
                          </View>
                        </View>
                        <Text style={[
                          styles.optionText,
                          phMonitoringResult === option.id && styles.selectedOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Mensaje informativo */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#0077B6" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Si nunca te han realizado estas pruebas, no te preocupes. Podemos generar recomendaciones
                basadas en tus síntomas y hábitos.
              </Text>
            </View>
            
            {/* Mensaje de error */}
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {/* Botón de enviar */}
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#0077B6" style={styles.activityIndicator} />
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  Guardar y Continuar
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Espacio adicional al final */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  keyboardContainer: {
    flex: 1,
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
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#0077B6',
    lineHeight: 22,
  },
  sectionCard: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#005f73',
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 10,
  },
  optionButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedOption: {
    borderColor: '#0077B6',
    backgroundColor: '#e6f7ff',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0077B6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#0077B6',
  },
  optionText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  selectedOptionText: {
    color: '#0077B6',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#e6f7ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#0077B6',
    flex: 1,
    lineHeight: 20,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFD2D2',
    padding: 10,
    borderRadius: 5,
  },
  activityIndicator: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  }
});