import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MainHeaderComponent from '../components/MainHeaderComponent';
import TabNavigationBar from '../components/TabNavigationBar';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '../constants/theme';

// Tipos
interface Article {
  id: number;
  title: string;
  icon: JSX.Element;
  content: string;
  bulletPoints: string[];
  warning: string;
  conclusion: string;
}

// Colores para categorías
const CATEGORY_COLORS = {
  diagnostic: theme.colors.primary,
  lifestyle: theme.colors.secondary,
  nutrition: theme.colors.accent,
  mental: '#9D4EDD'
};

// Contenido educativo mejorado
const EDUCATIONAL_CONTENT: Article[] = [
  {
    id: 1,
    title: "¿Por qué no todos los síntomas digestivos son reflujo?",
    icon: <MaterialIcons name="psychology" size={28} color="#ffffff" />,
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
    icon: <MaterialCommunityIcons name="test-tube" size={28} color="#ffffff" />,
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
    icon: <MaterialCommunityIcons name="food-apple" size={28} color="#ffffff" />,
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
    icon: <MaterialIcons name="sentiment-dissatisfied" size={28} color="#ffffff" />,
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

const { width } = Dimensions.get('window');

export default function EducationalContentScreen() {
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [readArticles, setReadArticles] = useState<Set<number>>(new Set());
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
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
    ]).start();
  }, []);
  
  // Función para alternar expandir/colapsar artículo
  const toggleArticle = (id: number) => {
    if (expandedArticle === id) {
      setExpandedArticle(null);
    } else {
      setExpandedArticle(id);
      // Marcar como leído
      setReadArticles(prev => new Set(prev).add(id));
    }
  };
  
  // Obtener estadísticas
  const getStats = () => {
    const totalArticles = EDUCATIONAL_CONTENT.length;
    const readCount = readArticles.size;
    const readPercentage = totalArticles > 0 ? (readCount / totalArticles) * 100 : 0;
    return { totalArticles, readCount, readPercentage };
  };
  
  const stats = getStats();
  
  // Renderizar un artículo educativo
  const renderArticle = (article: Article, index: number) => {
    const isExpanded = expandedArticle === article.id;
    const isRead = readArticles.has(article.id);
    
    return (
      <Animated.View
        key={article.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.articleCard,
            isExpanded && styles.expandedArticleCard,
            { borderLeftColor: theme.colors.primary }
          ]}
          onPress={() => toggleArticle(article.id)}
          activeOpacity={0.9}
        >
          <View style={styles.articleHeader}>
            <View style={[styles.articleIconContainer, { backgroundColor: theme.colors.primary }]}>
              {article.icon}
            </View>
            <View style={styles.articleInfoContainer}>
              <Text style={[styles.articleTitle, isRead && styles.readTitle]} numberOfLines={isExpanded ? undefined : 2}>
                {article.title}
              </Text>
              {isRead && (
                <View style={styles.articleMeta}>
                  <Icon name="checkmark-circle" size={14} color={theme.colors.success.main} />
                  <Text style={styles.readLabel}>Leído</Text>
                </View>
              )}
            </View>
            <Icon 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          
          {isExpanded && (
            <Animated.View style={[styles.articleContent, { opacity: fadeAnim }]}>
              <Text style={styles.contentText}>
                {article.content}
              </Text>
              
              <View style={styles.bulletPointsContainer}>
                {article.bulletPoints.map((point, idx) => (
                  <View key={idx} style={styles.bulletPoint}>
                    <View style={styles.bulletIcon}>
                      <Icon name="checkmark-circle" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
              
              <View style={[styles.warningContainer, { backgroundColor: theme.colors.error.bg }]}>
                <Icon name="alert-circle" size={24} color={theme.colors.error.main} />
                <Text style={styles.warningText}>{article.warning}</Text>
              </View>
              
              <View style={[styles.conclusionContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
                <View style={[styles.conclusionBar, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.conclusionText, { color: theme.colors.primary }]}>
                  {article.conclusion}
                </Text>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      <MainHeaderComponent />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera mejorada */}
        <View style={styles.headerBackground}>
          <View style={styles.headerPattern} />
          <View style={styles.headerContainer}>
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.multiply(slideAnim, -1) }],
                }
              ]}
            >
              <View style={styles.headerIcon}>
                <MaterialIcons name="school" size={40} color={theme.colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Centro de Aprendizaje</Text>
              <Text style={styles.headerSubtitle}>
                Comprende mejor tu salud digestiva
              </Text>
              
              {/* Estadísticas de lectura */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.readCount}</Text>
                  <Text style={styles.statLabel}>Leídos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.totalArticles}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{Math.round(stats.readPercentage)}%</Text>
                  <Text style={styles.statLabel}>Progreso</Text>
                </View>
              </View>
              
              {/* Barra de progreso */}
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${stats.readPercentage}%`,
                      opacity: fadeAnim
                    }
                  ]} 
                />
              </View>
            </Animated.View>
          </View>
        </View>
        
        {/* Lista de artículos */}
        <View style={styles.articlesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artículos destacados</Text>
            <Text style={styles.sectionSubtitle}>Basados en la Guía ERGE 2019</Text>
          </View>
          
          {EDUCATIONAL_CONTENT.map((article, index) => renderArticle(article, index))}
          
          {/* Call to action */}
          <View style={styles.ctaContainer}>
            <Icon name="book-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.ctaText}>
              Nuevos artículos cada mes
            </Text>
            <Text style={styles.ctaSubtext}>
              Mantente actualizado con las últimas recomendaciones
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Barra de navegación */}
      <TabNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  
  // Header mejorado
  headerBackground: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.secondary,
    opacity: 0.1,
  },
  headerContainer: {
    padding: theme.spacing.md,
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.secondary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  // Estadísticas
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border.light,
  },
  
  // Barra de progreso
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  
  // Categorías
  categoriesContainer: {
    marginTop: -30,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: theme.spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  
  // Sección de artículos
  articlesContainer: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  // Tarjeta de artículo
  articleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    ...theme.shadows.md,
  },
  expandedArticleCard: {
    ...theme.shadows.lg,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  articleInfoContainer: {
    flex: 1,
  },
  articleTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  readTitle: {
    color: theme.colors.text.secondary,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  separator: {
    marginHorizontal: theme.spacing.sm,
    color: theme.colors.text.secondary,
  },
  readLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success.main,
    marginLeft: 4,
  },
  
  // Contenido del artículo
  articleContent: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  contentText: {
    fontSize: theme.fontSize.base,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  bulletPointsContainer: {
    marginBottom: theme.spacing.lg,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  bulletIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  warningContainer: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  warningText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error.dark,
    lineHeight: 20,
  },
  conclusionContainer: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  conclusionBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  conclusionText: {
    fontSize: theme.fontSize.base,
    lineHeight: 22,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  
  // Call to action
  ctaContainer: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  ctaText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  ctaSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});