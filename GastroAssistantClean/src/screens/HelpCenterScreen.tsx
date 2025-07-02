import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MainHeaderComponent from '../components/MainHeaderComponent';
import { theme } from '../constants/theme';

// Tipos
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ProgramDetails: undefined;
  Profile: undefined;
  HelpCenter: undefined;
};

type HelpCenterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HelpCenter'>;

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon: string;
}

const { width } = Dimensions.get('window');

export default function HelpCenterScreen() {
  const navigation = useNavigation<HelpCenterScreenNavigationProp>();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Función para abrir enlaces
  const openURL = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      }
    } catch (error) {
      console.error('Error al abrir URL:', error);
    }
  };
  
  // Datos de las preguntas frecuentes
  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "¿Qué es GastroAssistant?",
      answer: "GastroAssistant es tu compañero digital para el manejo del reflujo gastroesofágico. Utilizamos inteligencia artificial y las últimas guías clínicas para ofrecerte un programa personalizado que te ayuda a mejorar tu calidad de vida mediante el seguimiento de hábitos, educación y recomendaciones basadas en evidencia.",
      icon: "information-circle"
    },
    {
      id: 2,
      question: "¿Cómo funciona el análisis de mi perfil?",
      answer: "Nuestro sistema analiza tus respuestas a los cuestionarios validados (GERD-Q y RSI) junto con tus datos clínicos para clasificar tu perfil según las guías médicas actuales. Esto nos permite crear un programa único adaptado a tus necesidades específicas, con recomendaciones personalizadas y un seguimiento efectivo.",
      icon: "analytics"
    },
    {
      id: 4,
      question: "¿Es segura mi información médica?",
      answer: "Tu privacidad es nuestra prioridad. Utilizamos encriptación de grado médico para proteger todos tus datos. Cumplimos con las regulaciones de protección de datos de salud más estrictas. Solo tú tienes acceso a tu información y nunca la compartimos sin tu consentimiento explícito.",
      icon: "shield-checkmark"
    },
    {
      id: 5,
      question: "¿La app reemplaza las consultas médicas?",
      answer: "No, GastroAssistant es una herramienta complementaria diseñada para apoyar, no reemplazar, la atención médica profesional. Siempre consulta con tu médico para diagnósticos, cambios en tratamientos o síntomas preocupantes. Nosotros te ayudamos a prepararte mejor para esas consultas y a seguir las recomendaciones médicas.",
      icon: "medical"
    },
    {
      id: 6,
      question: "¿Cómo funciona el tracker de hábitos?",
      answer: "El tracker te permite registrar diariamente tus 5 hábitos clave para el manejo del reflujo. Simplemente marca cómo te fue con cada hábito usando nuestro sistema de emojis intuitivo. El sistema calcula tu progreso, identifica patrones y te motiva con rachas y estadísticas visuales.",
      icon: "calendar"
    },
    {
      id: 7,
      question: "¿Qué significan los scores GERD-Q y RSI?",
      answer: "GERD-Q evalúa la probabilidad y severidad del reflujo gastroesofágico, mientras que RSI mide síntomas de reflujo laringofaríngeo. Ambos son cuestionarios validados médicamente. Usamos estos scores para personalizar tu programa y monitorear tu progreso a lo largo del tiempo.",
      icon: "stats-chart"
    },
    {
      id: 8,
      question: "¿Puedo exportar mis datos?",
      answer: "Próximamente podrás exportar todos tus datos en formato PDF para compartir con tu médico. Esto incluirá tu historial de hábitos, evolución de scores y notas. Es una herramienta valiosa para tus consultas médicas.",
      icon: "download"
    }
  ];
  
  // Toggle FAQ expandido
  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };
  
  // Renderizar FAQ item
  const renderFAQItem = (item: FAQItem, index: number) => {
    const isExpanded = expandedFAQ === item.id;
    
    return (
      <Animated.View
        key={item.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim,
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
          onPress={() => toggleFAQ(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.faqHeader}>
            <View style={[styles.faqIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Icon name={item.icon as any} size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Icon 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          {isExpanded && (
            <Animated.View style={styles.faqAnswerContainer}>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent showBackButton={true} />
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View 
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.heroIconContainer}>
              <MaterialCommunityIcons name="lifebuoy" size={50} color={theme.colors.primary} />
            </View>
            <Text style={styles.heroTitle}>¿Cómo podemos ayudarte?</Text>
            <Text style={styles.heroSubtitle}>
              Estamos aquí para resolver todas tus dudas
            </Text>
          </Animated.View>
        </View>
        
        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          
          {/* FAQ Items */}
          <View style={styles.faqList}>
            {faqData.map((faq, index) => renderFAQItem(faq, index))}
          </View>
        </View>
        
        {/* Contact Section */}
        <View style={styles.contactSection}>
          <View style={styles.contactCard}>
            <Icon name="mail-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.contactTitle}>¿Necesitas más ayuda?</Text>
            <Text style={styles.contactText}>
              Nuestro equipo de soporte está disponible para ayudarte con cualquier pregunta o problema
            </Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  // @ts-ignore
                  window.location.href = 'mailto:info@lymbia.com';
                } else {
                  Linking.openURL('mailto:info@lymbia.com');
                }
              }}
            >
              <Icon name="mail" size={20} color="#ffffff" />
              <Text style={styles.contactButtonText}>info@lymbia.com</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => openURL('https://lymbia.com/terms-of-service/')}
          >
            <Icon name="document-text-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.legalText}>Términos y Condiciones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => openURL('https://lymbia.com/privacy-policy/')}
          >
            <Icon name="shield-checkmark-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.legalText}>Política de Privacidad</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 40,
    paddingTop: theme.spacing.xl,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  heroTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // FAQ Section
  faqSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  faqList: {
    gap: theme.spacing.md,
  },
  faqItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  faqItemExpanded: {
    ...theme.shadows.md,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  faqAnswerContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  faqAnswer: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  
  // Contact Section
  contactSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  contactCard: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  contactText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  contactButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  
  // Legal Section
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  
  bottomSpacer: {
    height: 30,
  },
});