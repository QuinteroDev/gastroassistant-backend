// screens/EducationalContentScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderComponent from '../components/HeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Contenido educativo
const EDUCATIONAL_CONTENT = [
  {
    id: 1,
    title: "¿Por qué no todos los síntomas digestivos son reflujo?",
    icon: <MaterialIcons name="psychology" size={28} color="#0077B6" />,
    content: `Muchas personas sienten ardor, molestias en el estómago o acidez y piensan que tienen reflujo, pero no siempre es así. Hay varios cuadros clínicos que pueden generar sensaciones parecidas:`,
    bulletPoints: [
      "ERGE: hay reflujo de ácido desde el estómago al esófago y puede o no haber daño visible en las pruebas.",
      "Pirosis funcional: hay ardor pero sin hallazgos en pruebas. Se trata de una mayor sensibilidad del esófago.",
      "Hipersensibilidad esofágica: el ácido llega en cantidades normales pero se percibe con intensidad.",
      "Dispepsia funcional: sensación de llenado rápido, pesadez o molestia sin que haya reflujo real."
    ],
    warning: "Autodiagnosticarse puede llevar a tratar mal el problema. Por eso es clave una buena valoración.",
    conclusion: "Recuerda: No todos los ardores son reflujo ácido. Cada caso tiene su origen y su abordaje."
  },
  {
    id: 2,
    title: "La importancia de las pruebas: cuándo son necesarias y cuándo no",
    icon: <MaterialCommunityIcons name="test-tube" size={28} color="#0077B6" />,
    content: `No todas las personas necesitan pruebas invasivas como la endoscopia o la pH-metría. La guía indica que:`,
    bulletPoints: [
      "Si los síntomas son clásicos y no hay signos de alarma, se puede empezar con medidas y tratamiento sin pruebas.",
      "La endoscopia está indicada si hay: dificultad para tragar, anemia, sangrado digestivo, pérdida de peso o síntomas persistentes.",
      "La pH-metría se utiliza cuando los síntomas no mejoran con tratamiento o hay dudas diagnósticas."
    ],
    warning: "Hacerse pruebas sin criterio puede llevar a confusión, sobretratamiento o ansiedad innecesaria.",
    conclusion: "Consejo: si tus síntomas son nuevos, cambia tus hábitos y observa. Si persisten o son intensos, consulta con tu médico para valorar si necesitas exploraciones."
  },
  {
    id: 3,
    title: "¿Existen alimentos prohibidos? Lo que dice realmente la evidencia",
    icon: <MaterialCommunityIcons name="food-apple" size={28} color="#0077B6" />,
    content: `Una de las dudas más frecuentes: ¿hay alimentos prohibidos si tengo reflujo? La respuesta de la guía es clara: no hay alimentos universalmente prohibidos. Cada persona puede tener desencadenantes distintos.`,
    bulletPoints: [
      "Alimentos como grasas, chocolate, picantes, café, bebidas gaseosas o alcohol pueden empeorar los síntomas en algunas personas.",
      "Pero si no notas relación directa con ellos, no es necesario evitarlos."
    ],
    warning: "Hacer dietas excesivamente restrictivas puede generar más ansiedad, peor relación con la comida y nutrición incompleta.",
    conclusion: "Recomendación: escúchate. Si detectas algún alimento que empeora tus síntomas, reduce su consumo, pero no elimines por eliminar."
  },
  {
    id: 4,
    title: "¿Cómo afecta el estrés a los síntomas digestivos?",
    icon: <MaterialIcons name="sentiment-dissatisfied" size={28} color="#0077B6" />,
    content: `El estrés no solo afecta la mente. También influye directamente en el sistema digestivo. La guía reconoce que:`,
    bulletPoints: [
      "Las personas con reflujo pueden tener mayor sensibilidad al ácido cuando están estresadas.",
      "El estrés puede alterar la motilidad digestiva y la percepción de los síntomas.",
      "En casos de hipersensibilidad o pirosis funcional, el componente emocional es especialmente relevante."
    ],
    warning: "A veces no se trata de tener más ácido, sino de estar más reactivo a él.",
    conclusion: "Herramienta clave: trabajar la regulación emocional, la respiración y los tiempos de autocuidado. No es secundario: es parte del tratamiento."
  }
];

export default function EducationalContentScreen() {
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  
  // Función para alternar expandir/colapsar artículo
  const toggleArticle = (id: number) => {
    if (expandedArticle === id) {
      setExpandedArticle(null);
    } else {
      setExpandedArticle(id);
    }
  };
  
  // Renderizar un artículo educativo
  const renderArticle = (article) => {
    const isExpanded = expandedArticle === article.id;
    
    return (
      <TouchableOpacity
        key={article.id}
        style={[
          styles.articleCard,
          isExpanded && styles.expandedArticleCard
        ]}
        onPress={() => toggleArticle(article.id)}
        activeOpacity={0.8}
      >
        <View style={styles.articleHeader}>
          <View style={styles.articleIconContainer}>
            {article.icon}
          </View>
          <Text style={styles.articleTitle} numberOfLines={isExpanded ? undefined : 2}>
            {article.title}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={22} 
            color="#0077B6" 
          />
        </View>
        
        {isExpanded && (
          <View style={styles.articleContent}>
            <Text style={styles.contentText}>
              {article.content}
            </Text>
            
            <View style={styles.bulletPointsContainer}>
              {article.bulletPoints.map((point, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="checkmark-circle" size={18} color="#0077B6" />
                  </View>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle" size={24} color="#d32f2f" />
              <Text style={styles.warningText}>{article.warning}</Text>
            </View>
            
            <Text style={styles.conclusionText}>
              {article.conclusion}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent title="Contenido Educativo" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Cabecera */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#00B4D8', '#0077B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <MaterialIcons name="school" size={36} color="#ffffff" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Aprende sobre tu digestión</Text>
                <Text style={styles.headerSubtitle}>
                  Contenido basado en la Guía ERGE 2019
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        {/* Lista de artículos */}
        <View style={styles.articlesContainer}>
          <Text style={styles.sectionTitle}>Artículos educativos</Text>
          
          {EDUCATIONAL_CONTENT.map(article => renderArticle(article))}
        </View>
      </ScrollView>
      
      {/* Barra de navegación */}
      <TabNavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Cabecera
  headerContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Sección de artículos
  articlesContainer: {
    padding: 16,
    marginTop: -20,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 16,
  },
  // Tarjeta de artículo
  articleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expandedArticleCard: {
    backgroundColor: '#f0f7fa',
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  articleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0077B6',
  },
  // Contenido del artículo
  articleContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#333',
    marginBottom: 16,
  },
  bulletPointsContainer: {
    marginBottom: 16,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bulletIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: '#333',
  },
  warningContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#d32f2f',
  },
  conclusionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#0077B6',
    fontStyle: 'italic',
  },
});