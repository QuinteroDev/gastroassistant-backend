// src/screens/OnboardingGerdQScreen.tsx
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
import Icon from 'react-native-vector-icons/Ionicons';
import HeaderComponent from '../components/HeaderComponent';
import ProgressBar from '../components/ProgressBar';
import api from '../utils/api';
import { getData, saveOnboardingProgress } from '../utils/storage';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import { theme } from '../constants/theme';
import { useRoute } from '@react-navigation/native';

// Tipos de navegación - actualizaremos después en un archivo separado
type RootStackParamList = {
 Login: undefined;
 Register: undefined;
 Home: undefined;
 OnboardingWelcome: undefined;
 OnboardingGeneral: undefined;
 OnboardingGerdQ: undefined;
 OnboardingRsi: undefined;
};

type OnboardingGerdQNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingGerdQ'>;

// ID del cuestionario GerdQ en el sistema
const GERDQ_QUESTIONNAIRE_ID = 1;

// Interfaces para las preguntas y opciones
interface Option {
 id: number;
 text: string;
 value: number;
 order: number;
}

interface Question {
 id: number;
 text: string;
 order: number;
 options: Option[];
}

interface Questionnaire {
 id: number;
 name: string;
 title: string;
 type: string;
 description: string;
 questions: Question[];
}

export default function OnboardingGerdQScreen() {
 const navigation = useNavigation<OnboardingGerdQNavigationProp>();
 const route = useRoute(); // ← MOVIDO AQUÍ
 const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
 const [answers, setAnswers] = useState<{[key: number]: number}>({});
 const [isLoading, setIsLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Verificar token al cargar la pantalla
 useEffect(() => {
   const checkAuth = async () => {
     console.log("Verificando token en OnboardingGerdQScreen...");
     const token = await getData('authToken');
     if (!token) {
       console.log("No hay token, redirigiendo a Login...");
       navigation.reset({
         index: 0,
         routes: [{ name: 'Login' }],
       });
       return;
     }
     
     // Guardar la pantalla actual
     await saveOnboardingProgress('OnboardingGerdQ');
     const isRenewal = (route.params as any)?.isRenewal || false; // ← CAMBIADO

     // Solo verificar onboarding completo si NO es una renovación
     if (!isRenewal) {
       try {
         const profileResponse = await api.get('/api/profiles/me/');
         if (profileResponse.data && profileResponse.data.onboarding_complete) {
           console.log("Onboarding ya completado, redirigiendo a ProgramDetails...");
           (navigation as any).reset({
             index: 0,
             routes: [{ name: 'ProgramDetails' }],
           });
           return;
         }
       } catch (error) {
         console.error("Error al verificar estado de onboarding:", error);
       }
     } else {
       console.log("Es renovación de ciclo, continuando con cuestionarios...");
     }
 
     // Si hay token, cargar el cuestionario
     fetchQuestionnaire();
   };
 
   checkAuth();
 }, [navigation]);

 // Función para cargar el cuestionario desde el backend
 const fetchQuestionnaire = async () => {
   setIsLoading(true);
   setError(null);
   
   try {
     console.log("Obteniendo cuestionario GerdQ...");
     
     // Obtener el token de autenticación
     const token = await getData('authToken');
     if (!token) {
       throw new Error('No se encontró token de autenticación');
     }
     
     // Hacer la solicitud al backend
     const response = await api.get(`/api/questionnaires/${GERDQ_QUESTIONNAIRE_ID}/`);
     
     console.log("Datos del cuestionario GerdQ:", 
       response.data ? `ID:${response.data.id}, Preguntas:${response.data.questions?.length || 0}` : "No hay datos");
     
     // Verificar la estructura de datos
     if (response.data && response.data.questions) {
       response.data.questions.forEach((q: any, i: number) => {
         console.log(`Pregunta ${i+1}: ID:${q.id}, Opciones:${q.options?.length || 0}`);
         if (q.options && q.options.length > 0) {
           console.log(`  Opción 1: ID:${q.options[0].id}, Texto:"${q.options[0].text}"`);
         }
       });
       
       // Ordenar las preguntas por el campo "order"
       response.data.questions.sort((a: Question, b: Question) => a.order - b.order);
       
       // Ordenar las opciones de cada pregunta por el campo "order"
       response.data.questions.forEach((q: Question) => {
         if (q.options) {
           q.options.sort((a: Option, b: Option) => a.order - b.order);
         }
       });
     }
     
     setQuestionnaire(response.data);
   } catch (err: any) {
     console.error("Error loading questionnaire:", err);
     let message = "Error al cargar el cuestionario";
     
     // Verificar si usamos datos simulados en desarrollo
     if (__DEV__) {
       console.log("Cargando datos de cuestionario simulados para desarrollo");
       
       // Datos de cuestionario simulados para desarrollo
       const mockQuestionnaire = {
         id: 1,
         name: 'GerdQ',
         title: 'Cuestionario GerdQ',
         type: 'diagnostic',
         description: 'Este cuestionario evalúa tus síntomas de reflujo. Por favor, responde todas las preguntas sobre cómo te has sentido en las últimas 4 semanas.',
         questions: [
           {
             id: 1,
             text: '¿Con qué frecuencia has sentido ardor detrás del esternón (pirosis)?',
             order: 1,
             options: [
               { id: 1, text: '0 días', value: 0, order: 1 },
               { id: 2, text: '1 día', value: 1, order: 2 },
               { id: 3, text: '2-3 días', value: 2, order: 3 },
               { id: 4, text: '4-7 días', value: 3, order: 4 },
             ]
           },
           {
             id: 2,
             text: '¿Con qué frecuencia has sentido contenido del estómago regresando a la garganta o boca (regurgitación)?',
             order: 2,
             options: [
               { id: 5, text: '0 días', value: 0, order: 1 },
               { id: 6, text: '1 día', value: 1, order: 2 },
               { id: 7, text: '2-3 días', value: 2, order: 3 },
               { id: 8, text: '4-7 días', value: 3, order: 4 },
             ]
           },
           {
             id: 3,
             text: '¿Con qué frecuencia has sentido dolor en la parte superior del estómago?',
             order: 3,
             options: [
               { id: 9, text: '0 días', value: 3, order: 1 },
               { id: 10, text: '1 día', value: 2, order: 2 },
               { id: 11, text: '2-3 días', value: 1, order: 3 },
               { id: 12, text: '4-7 días', value: 0, order: 4 },
             ]
           },
           {
             id: 4,
             text: '¿Con qué frecuencia has sentido náuseas?',
             order: 4,
             options: [
               { id: 13, text: '0 días', value: 3, order: 1 },
               { id: 14, text: '1 día', value: 2, order: 2 },
               { id: 15, text: '2-3 días', value: 1, order: 3 },
               { id: 16, text: '4-7 días', value: 0, order: 4 },
             ]
           },
           {
             id: 5,
             text: '¿Con qué frecuencia has tenido dificultad para dormir por la pirosis o regurgitación?',
             order: 5,
             options: [
               { id: 17, text: '0 días', value: 0, order: 1 },
               { id: 18, text: '1 día', value: 1, order: 2 },
               { id: 19, text: '2-3 días', value: 2, order: 3 },
               { id: 20, text: '4-7 días', value: 3, order: 4 },
             ]
           },
           {
             id: 6,
             text: '¿Con qué frecuencia has tomado medicamentos adicionales para la acidez o reflujo, además de los que te recetó tu médico?',
             order: 6,
             options: [
               { id: 21, text: '0 días', value: 0, order: 1 },
               { id: 22, text: '1 día', value: 1, order: 2 },
               { id: 23, text: '2-3 días', value: 2, order: 3 },
               { id: 24, text: '4-7 días', value: 3, order: 4 },
             ]
           }
         ]
       };
       
       setQuestionnaire(mockQuestionnaire);
       return;
     }
     
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
 
 // Manejar selección de respuesta
 const handleSelectAnswer = (questionId: number, optionId: number) => {
   console.log(`Seleccionando respuesta: Pregunta ID=${questionId}, Opción ID=${optionId}`);
   setAnswers(prev => ({
     ...prev,
     [questionId]: optionId
   }));
 };
 
 // Enviar respuestas al backend
 const handleSubmit = async () => {
   // Validar que todas las preguntas tienen respuesta
   if (
     !questionnaire?.questions ||
     questionnaire.questions.length === 0 ||
     Object.keys(answers).length !== questionnaire.questions.length
   ) {
     Alert.alert('Incompleto', 'Por favor, responde todas las preguntas del cuestionario.');
     return;
   }
 
   setIsSubmitting(true);
   setError(null);
 
   try {
     // Obtener el token de autenticación
     const token = await getData('authToken');
     if (!token) {
       throw new Error('No se encontró token de autenticación');
     }
 
     // Formatear las respuestas para enviar al API
     const answersData = Object.entries(answers).map(([questionId, optionId]) => ({
       question_id: parseInt(questionId),
       selected_option_id: optionId
     }));
 
     console.log("Enviando respuestas:", answersData);
 
     // Enviar las respuestas al backend
     let responseData;
     
     if (__DEV__) {
       console.log("Modo desarrollo - intentando enviar datos reales");
       try {
         const response = await api.post(`/api/questionnaires/${GERDQ_QUESTIONNAIRE_ID}/submit/`, {
           answers: answersData
         });
         
         responseData = response.data;
         console.log("Respuesta del servidor:", responseData);
       } catch (realApiErr) {
         console.warn("No se pudo enviar al servidor real, usando respuesta simulada", realApiErr);
         responseData = {
           success: true,
           score: 10
         };
       }
     } else {
       // Llamada real a API en producción
       const response = await api.post(`/api/questionnaires/${GERDQ_QUESTIONNAIRE_ID}/submit/`, {
         answers: answersData
       });
       
       responseData = response.data;
     }
 
     console.log("Respuestas enviadas correctamente:", responseData);
     
     // Guardar el progreso - por ahora navegamos a Home hasta implementar OnboardingRsi
     await saveOnboardingProgress('OnboardingRsi');
     
     // Navegar a la siguiente pantalla del onboarding
     console.log("Navegando a OnboardingRsi...");
     navigation.navigate('OnboardingRsi');
 
   } catch (err: any) {
     console.error("Error al enviar respuestas:", err);
     let message = "Error al enviar las respuestas";
     
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
       Alert.alert("Error", message);
     }
   } finally {
     setIsSubmitting(false);
   }
 };

 // Verificar si todas las preguntas tienen respuesta
 const allQuestionsAnswered = questionnaire?.questions && 
   Object.keys(answers).length === questionnaire.questions.length;

 return (
   <View style={styles.container}>
     <HeaderComponent 
       showBackButton={true} 
       onBackPress={() => navigation.goBack()} 
     />

     <ProgressBar 
       currentStep={ONBOARDING_STEPS.GERDQ} 
       totalSteps={ONBOARDING_STEPS.TOTAL_STEPS} 
     />
     
     <KeyboardAvoidingView 
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       style={styles.keyboardContainer}
     >
     
     {isLoading ? (
       <View style={styles.centerContent}>
         <ActivityIndicator size="large" color={theme.colors.primary} />
         <Text style={styles.loadingText}>Cargando cuestionario...</Text>
       </View>
     ) : error ? (
       <View style={styles.centerContent}>
         <Icon name="alert-circle-outline" size={48} color={theme.colors.error.main} />
         <Text style={styles.errorText}>{error}</Text>
         <TouchableOpacity
           style={styles.retryButton}
           onPress={() => fetchQuestionnaire()}
         >
           <Text style={styles.retryButtonText}>Reintentar</Text>
         </TouchableOpacity>
       </View>
     ) : !questionnaire ? (
       <View style={styles.centerContent}>
         <Icon name="help-circle-outline" size={48} color={theme.colors.error.main} />
         <Text style={styles.errorText}>No se pudo cargar el cuestionario</Text>
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
           <View style={styles.headerSection}>
             <Icon name="medical" size={40} color={theme.colors.primary} />
             <Text style={styles.title}>{questionnaire.title || 'Cuestionario GerdQ'}</Text>
           </View>
           
           <Text style={styles.description}>
             {questionnaire.description || 'Por favor responde todas las preguntas del cuestionario.'}
           </Text>
           
           <View style={styles.infoCard}>
             <Icon name="information-circle" size={20} color={theme.colors.info.main} />
             <Text style={styles.infoText}>
               Responde basándote en cómo te has sentido durante las últimas 4 semanas
             </Text>
           </View>
           
           {/* Renderizado de preguntas */}
           {questionnaire.questions && questionnaire.questions.length > 0 ? (
             questionnaire.questions.map((question: Question, index: number) => (
               <View key={question.id} style={styles.questionCard}>
                 <View style={styles.questionHeader}>
                   <View style={styles.questionNumber}>
                     <Text style={styles.questionNumberText}>{index + 1}</Text>
                   </View>
                   <Text style={styles.questionText}>{question.text}</Text>
                 </View>
                 
                 {/* Renderizado de opciones */}
                 {question.options && question.options.length > 0 ? (
                   question.options.map((option: Option) => (
                     <TouchableOpacity
                       key={option.id}
                       style={[
                         styles.optionButton,
                         answers[question.id] === option.id && styles.selectedOption
                       ]}
                       onPress={() => handleSelectAnswer(question.id, option.id)}
                       disabled={isSubmitting}
                     >
                       <View style={styles.optionRow}>
                         <View style={styles.radioContainer}>
                           <View style={[
                             styles.radioOuter,
                             answers[question.id] === option.id && styles.radioOuterSelected
                           ]}>
                             {answers[question.id] === option.id && 
                               <View style={styles.radioInner} />
                             }
                           </View>
                         </View>
                         <Text style={[
                           styles.optionText,
                           answers[question.id] === option.id && styles.selectedOptionText
                         ]}>
                           {option.text}
                         </Text>
                       </View>
                     </TouchableOpacity>
                   ))
                 ) : (
                   <Text style={styles.errorText}>No hay opciones disponibles para esta pregunta</Text>
                 )}
               </View>
             ))
           ) : (
             <Text style={styles.errorText}>No hay preguntas disponibles en el cuestionario</Text>
           )}
           
           <View style={styles.buttonContainer}>
             {isSubmitting ? (
               <ActivityIndicator size="large" color={theme.colors.primary} />
             ) : (
               <TouchableOpacity
                 style={[
                   styles.submitButton,
                   !allQuestionsAnswered && styles.disabledButton
                 ]}
                 onPress={handleSubmit}
                 disabled={!allQuestionsAnswered}
               >
                 <Text style={styles.submitButtonText}>Enviar respuestas</Text>
                 <Icon name="arrow-forward" size={20} color={theme.colors.surface} style={styles.buttonIcon} />
               </TouchableOpacity>
             )}
           </View>
           
           <View style={styles.bottomPadding} />
         </View>
       </ScrollView>
     )}
     </KeyboardAvoidingView>
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: theme.colors.background,
 },
 keyboardContainer: {
   flex: 1,
 },
 scrollContainer: {
   flexGrow: 1,
 },
 centerContent: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
   padding: theme.spacing.lg,
 },
 content: {
   padding: theme.spacing.md,
 },
 headerSection: {
   alignItems: 'center',
   marginBottom: theme.spacing.md,
 },
 title: {
   fontSize: theme.fontSize.xxl,
   fontWeight: 'bold',
   textAlign: 'center',
   marginTop: theme.spacing.sm,
   color: theme.colors.text.primary,
 },
 description: {
   fontSize: theme.fontSize.base,
   textAlign: 'center',
   marginBottom: theme.spacing.lg,
   color: theme.colors.text.secondary,
   lineHeight: 22,
 },
 infoCard: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: theme.colors.info.light,
   padding: theme.spacing.md,
   borderRadius: theme.borderRadius.md,
   marginBottom: theme.spacing.lg,
 },
 infoText: {
   flex: 1,
   marginLeft: theme.spacing.sm,
   fontSize: theme.fontSize.sm,
   color: theme.colors.info.dark,
 },
 questionCard: {
   backgroundColor: theme.colors.surface,
   borderRadius: theme.borderRadius.md,
   padding: theme.spacing.md,
   marginBottom: theme.spacing.lg,
   ...theme.shadows.sm,
 },
 questionHeader: {
   flexDirection: 'row',
   marginBottom: theme.spacing.md,
 },
 questionNumber: {
   width: 28,
   height: 28,
   borderRadius: 14,
   backgroundColor: theme.colors.primary,
   justifyContent: 'center',
   alignItems: 'center',
   marginRight: theme.spacing.md,
 },
 questionNumberText: {
   color: theme.colors.surface,
   fontSize: theme.fontSize.sm,
   fontWeight: 'bold',
 },
 questionText: {
   flex: 1,
   fontSize: theme.fontSize.base,
   fontWeight: '500',
   color: theme.colors.text.primary,
   lineHeight: 22,
 },
 optionButton: {
   padding: theme.spacing.md,
   borderWidth: 1.5,
   borderColor: theme.colors.border.light,
   borderRadius: theme.borderRadius.md,
   marginBottom: theme.spacing.sm,
   backgroundColor: theme.colors.background,
 },
 selectedOption: {
   borderColor: theme.colors.primary,
   backgroundColor: `${theme.colors.secondary}15`,
 },
 optionRow: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 radioContainer: {
   marginRight: theme.spacing.md,
 },
 radioOuter: {
   height: 22,
   width: 22,
   borderRadius: 11,
   borderWidth: 2,
   borderColor: theme.colors.border.main,
   alignItems: 'center',
   justifyContent: 'center',
   backgroundColor: theme.colors.surface,
 },
 radioOuterSelected: {
   borderColor: theme.colors.primary,
 },
 radioInner: {
   height: 12,
   width: 12,
   borderRadius: 6,
   backgroundColor: theme.colors.primary,
 },
 optionText: {
   fontSize: theme.fontSize.base,
   color: theme.colors.text.secondary,
   flex: 1,
 },
 selectedOptionText: {
   color: theme.colors.primary,
   fontWeight: '500',
 },
 buttonContainer: {
   marginVertical: theme.spacing.xl,
 },
 loadingText: {
   marginTop: theme.spacing.md,
   fontSize: theme.fontSize.base,
   color: theme.colors.text.secondary,
 },
 errorText: {
   color: theme.colors.error.main,
   textAlign: 'center',
   marginVertical: theme.spacing.md,
   fontSize: theme.fontSize.base,
 },
 submitButton: {
   backgroundColor: theme.colors.primary,
   borderRadius: theme.borderRadius.md,
   paddingVertical: theme.spacing.md,
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'center',
   ...theme.shadows.sm,
 },
 disabledButton: {
   backgroundColor: theme.colors.button.primary.disabled,
 },
 submitButtonText: {
   color: theme.colors.surface,
   fontSize: theme.fontSize.base,
   fontWeight: '600',
 },
 buttonIcon: {
   marginLeft: theme.spacing.sm,
 },
 retryButton: {
   marginTop: theme.spacing.md,
   backgroundColor: theme.colors.primary,
   paddingVertical: theme.spacing.md,
   paddingHorizontal: theme.spacing.lg,
   borderRadius: theme.borderRadius.md,
   ...theme.shadows.sm,
 },
 retryButtonText: {
   color: theme.colors.surface,
   fontSize: theme.fontSize.base,
   fontWeight: '500',
 },
 bottomPadding: {
   height: 100,
 }
});