// screens/HelpCenterScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderComponent from '../components/HeaderComponent';

export default function HelpCenterScreen({ navigation }) {
  
  // Función para abrir enlaces externos
  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("No se puede abrir la URL: " + url);
      }
    } catch (error) {
      console.error('Error al abrir URL:', error);
    }
  };

  // Datos de las preguntas frecuentes
  const faqData = [
    {
      id: 1,
      question: "¿Qué es GastroAssistant?",
      answer: "GastroAssistant es una aplicación diseñada para ayudarte a gestionar y hacer seguimiento de tu salud digestiva, especialmente enfocada en el reflujo gastroesofágico (ERGE)."
    },
    {
      id: 2,
      question: "¿Cómo funciona el análisis de mi perfil?",
      answer: "Basándonos en tus cuestionarios junto con los resultados de tus pruebas médicas, clasificamos tu perfil según las guías clínicas actuales para ofrecerte recomendaciones personalizadas."
    },
    {
      id: 3,
      question: "¿Puedo actualizar mis datos clínicos?",
      answer: "Sí, puedes actualizar tus datos en cualquier momento desde la sección 'Mi Perfil' > 'Actualizar Datos Clínicos'. Esto ayudará a mantener tus recomendaciones actualizadas."
    },
    {
      id: 4,
      question: "¿Es segura mi información médica?",
      answer: "Sí, toda tu información está protegida. Solo tú puedes acceder a tus datos y nunca compartimos información personal sin tu consentimiento explícito."
    },
    {
      id: 5,
      question: "¿La app reemplaza las consultas médicas?",
      answer: "No, GastroAssistant es una herramienta complementaria. Siempre debes consultar con tu médico para diagnósticos, tratamientos y decisiones importantes sobre tu salud."
    }
  ];

  // Renderizar cada pregunta frecuente
  const renderFAQItem = (item) => (
    <View key={item.id} style={styles.faqItem}>
      <View style={styles.faqHeader}>
        <Ionicons name="help-circle-outline" size={20} color="#0077B6" />
        <Text style={styles.faqQuestion}>{item.question}</Text>
      </View>
      <Text style={styles.faqAnswer}>{item.answer}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent 
        title="Centro de Ayuda" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={styles.contentContainer}>
        {/* Bienvenida */}
        <View style={styles.welcomeSection}>
          <Ionicons name="help-circle" size={60} color="#0077B6" />
          <Text style={styles.welcomeTitle}>¿En qué podemos ayudarte?</Text>
          <Text style={styles.welcomeText}>
            Encuentra respuestas a las preguntas más frecuentes o contacta con nuestro equipo de soporte.
          </Text>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Linking.openURL('mailto:info@lymbia.com')}
          >
            <Ionicons name="mail" size={24} color="#0077B6" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Contactar Soporte</Text>
              <Text style={styles.actionSubtitle}>info@lymbia.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openURL('https://lymbia.com/terms-of-service/')}
          >
            <Ionicons name="document-text" size={24} color="#0077B6" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Términos y Condiciones</Text>
              <Text style={styles.actionSubtitle}>Consulta nuestros términos de servicio</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openURL('https://lymbia.com/privacy-policy/')}
          >
            <Ionicons name="shield-checkmark" size={24} color="#0077B6" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Política de Privacidad</Text>
              <Text style={styles.actionSubtitle}>Conoce cómo protegemos tu información</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Preguntas frecuentes */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          {faqData.map(renderFAQItem)}
        </View>

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>¿Necesitas más ayuda?</Text>
          <Text style={styles.infoText}>
            Si no encuentras la respuesta que buscas, no dudes en contactar con nuestro equipo de soporte. 
            Estaremos encantados de ayudarte.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickActionsSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  faqSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginLeft: 28,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
});