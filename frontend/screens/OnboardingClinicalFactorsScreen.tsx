// screens/OnboardingClinicalFactorsScreen.tsx
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
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import api from '../utils/api';
import { getData } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

type OnboardingClinicalFactorsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingClinicalFactors'>;

interface ClinicalFactorsData {
  has_hernia: string;
  has_altered_motility: string;
  has_slow_emptying: string;
  has_dry_mouth: string;
  has_constipation: string;
  stress_affects: string;
}

export default function OnboardingClinicalFactorsScreen() {
  const navigation = useNavigation<OnboardingClinicalFactorsNavigationProp>();
  
  // Estado para cada factor clínico
  const [hasHernia, setHasHernia] = useState<string | null>(null);
  const [alteredMotility, setAlteredMotility] = useState<string | null>(null);
  const [slowEmptying, setSlowEmptying] = useState<string | null>(null);
  const [dryMouth, setDryMouth] = useState<string | null>(null);
  const [constipation, setConstipation] = useState<string | null>(null);
  const [stressAffects, setStressAffects] = useState<string | null>(null);
  
  // Estado de la UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar token al cargar la pantalla
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando token en OnboardingClinicalFactorsScreen...");
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
  
  // Validar el formulario
  const validateForm = (): boolean => {
    if (!hasHernia || !alteredMotility || !slowEmptying || !dryMouth || !constipation || !stressAffects) {
      setError('Por favor, responde todas las preguntas del cuestionario.');
      return false;
    }
    return true;
  };
  
  // Enviar respuestas
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Preparar los datos para enviar
      const clinicalFactorsData: ClinicalFactorsData = {
        has_hernia: hasHernia,
        has_altered_motility: alteredMotility,
        has_slow_emptying: slowEmptying,
        has_dry_mouth: dryMouth,
        has_constipation: constipation,
        stress_affects: stressAffects
      };
      
      console.log("Enviando datos de factores clínicos:", clinicalFactorsData);
      
      // Enviar datos al servidor
      const response = await api.patch('/api/profiles/me/', clinicalFactorsData);
      
      console.log("Datos de factores clínicos enviados correctamente:", response.data);
      
      // Navegar directamente a la pantalla de pruebas diagnósticas antes de mostrar el Alert
      console.log("Intentando navegar a OnboardingDiagnosticTests...");
      navigation.navigate('OnboardingDiagnosticTests');
      
      // Mostrar mensaje de éxito después de iniciar la navegación
      Alert.alert(
        "Información Registrada",
        "Tus datos sobre factores clínicos han sido guardados correctamente.",
        [{ text: "Aceptar" }]
      );
    } catch (err) {
      console.error("Error al enviar datos de factores clínicos:", err);
      let message = "Error al guardar los datos de factores clínicos";
      
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
  
  // Renderizar opciones para cada pregunta (sí/no/no lo sé)
  const renderOptions = (question: string, value: string | null, setValue: (value: string) => void, options: Array<{id: string, label: string, icon?: string, color?: string}>) => {
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}</Text>
        <View style={styles.optionsRowContainer}>
          {options.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                value === option.id && styles.selectedOption,
                option.color && value === option.id && { backgroundColor: option.color },
                // Ancho fijo para todas las opciones independientemente del texto
                { width: (100 / options.length - 2) + '%' }
              ]}
              onPress={() => setValue(option.id)}
              disabled={isSubmitting}
            >
              {option.icon && (
                <Ionicons 
                  name={option.icon as any} 
                  size={18} 
                  color={value === option.id ? '#fff' : '#666'} 
                  style={styles.optionIcon}
                />
              )}
              <Text style={[
                styles.optionText,
                value === option.id && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  // Opciones estándar para preguntas de sí/no/no lo sé
  const yesNoUnknownOptions = [
    { id: 'YES', label: 'Sí', icon: 'checkmark-circle-outline', color: '#4caf50' },
    { id: 'NO', label: 'No', icon: 'close-circle-outline', color: '#f44336' },
    { id: 'UNKNOWN', label: 'No sé', icon: 'help-circle-outline', color: '#ff9800' } // Acortado para mejor visualización
  ];
  
  // Opciones para preguntas de sí/no
  const yesNoOptions = [
    { id: 'YES', label: 'Sí', icon: 'checkmark-circle-outline', color: '#4caf50' },
    { id: 'NO', label: 'No', icon: 'close-circle-outline', color: '#f44336' }
  ];
  
  // Opciones para la pregunta de estrés/ansiedad
  const stressOptions = [
    { id: 'YES', label: 'Sí, claramente', icon: 'checkmark-circle-outline', color: '#4caf50' },
    { id: 'SOMETIMES', label: 'A veces', icon: 'time-outline', color: '#ff9800' },
    { id: 'NO', label: 'No', icon: 'close-circle-outline', color: '#f44336' }
  ];
  
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
            <Text style={styles.title}>Factores Clínicos</Text>
            
            <Text style={styles.description}>
              Por favor, responde a estas preguntas sobre factores que pueden influir en tu reflujo.
              Esta información nos ayudará a personalizar tus recomendaciones.
            </Text>
            
            {/* Factor 1: Hernia de hiato - Movido de OnboardingGeneral */}
            {renderOptions(
              '¿Te han diagnosticado hernia de hiato o una válvula de cierre del estómago débil (cardias incompetente)?',
              hasHernia,
              setHasHernia,
              yesNoUnknownOptions
            )}
            
            {/* Factor 2: Motilidad esofágica alterada */}
            {renderOptions(
              '¿Te han detectado alguna alteración en el movimiento del esófago (por ejemplo, en una manometría o prueba funcional)?',
              alteredMotility,
              setAlteredMotility,
              yesNoUnknownOptions
            )}
            
            {/* Factor 3: Vaciamiento gástrico lento */}
            {renderOptions(
              '¿Te han dicho que tu estómago vacía más lento de lo normal (gastroparesia)?',
              slowEmptying,
              setSlowEmptying,
              yesNoUnknownOptions
            )}
            
            {/* Factor 4: Salivación reducida */}
            {renderOptions(
              '¿Tienes sequedad de boca frecuente o te han comentado que produces poca saliva?',
              dryMouth,
              setDryMouth,
              yesNoUnknownOptions
            )}
            
            {/* Factor 5: Estreñimiento */}
            {renderOptions(
              '¿Sueles tener estreñimiento o necesitas hacer mucho esfuerzo al ir al baño?',
              constipation,
              setConstipation,
              yesNoOptions
            )}
            
            {/* Factor 6: Estrés/ansiedad */}
            {renderOptions(
              '¿Sientes que el estrés o la ansiedad empeoran claramente tus síntomas digestivos?',
              stressAffects,
              setStressAffects,
              stressOptions
            )}
            
            {/* Mensaje de error */}
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {/* Botón de enviar */}
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#0077B6" style={styles.activityIndicator} />
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
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
  questionContainer: {
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
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch', // Asegura que todos los elementos tengan la misma altura
    marginHorizontal: -3, // Ajuste para compensar los márgenes internos
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    minHeight: 50, // Asegurar altura mínima uniforme
  },
  selectedOption: {
    borderColor: '#0077B6',
    backgroundColor: '#0077B6',
  },
  optionIcon: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    flexShrink: 1, // Permite que el texto se ajuste dentro del contenedor
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '500',
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