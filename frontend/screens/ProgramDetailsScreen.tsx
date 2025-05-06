// screens/ProgramDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import HeaderComponent from '../components/HeaderComponent';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { getData } from '../utils/storage';
import TabNavigationBar from '../components/TabNavigationBar';


type ProgramDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProgramDetails'>;


// Colores para cada tipo de programa (ahora solo para la decoración interna)
const PROGRAM_COLORS = {
  'A': ['#2DC653', '#3DD15F'], // ERGE Erosiva (verde)
  'B': ['#FFD166', '#FFDA85'], // ERGE No Erosiva (amarillo)
  'C': ['#3A86FF', '#61A0FF'], // Reflujo Extraesofágico (azul)
  'D': ['#9D4EDD', '#B76EF0']  // Programa D (morado)
};

// Iconos para cada sección del programa
const SECTION_ICONS = {
  'que_significa': <MaterialIcons name="psychology" size={24} color="#0077B6" />,
  'por_que_importante': <Ionicons name="alert-circle" size={24} color="#0077B6" />,
  'que_hacer': <Ionicons name="checkmark-circle" size={24} color="#0077B6" />,
  'seguimiento_medico': <FontAwesome5 name="hospital-user" size={22} color="#0077B6" />
};

// Contenido para cada bloque (igual que antes)
const PROGRAM_BLOCKS = {
  // Bloque 1 - ERGE Erosiva (🟩)
  1: {
    title: "ERGE Erosiva",
    sections: [
      {
        id: 'que_significa',
        title: "¿Qué significa tu perfil?",
        content: "En tu endoscopia se ha identificado una inflamación en el esófago, conocida como esofagitis erosiva. Esto confirma que tu reflujo está generando daño en el tejido esofágico, y requiere un abordaje médico adecuado."
      },
      {
        id: 'por_que_importante',
        title: "¿Por qué es importante prestarle atención?",
        content: [
          "La esofagitis puede producir síntomas como ardor, molestias al tragar, acidez o incluso dolor torácico.",
          "En algunos casos, si no se trata bien, puede dar lugar a complicaciones como úlceras, estrechamiento del esófago o un tipo especial de cambio en la mucosa (llamado esófago de Barrett).",
          "Por eso, este tipo de reflujo siempre debe ser supervisado por tu médico."
        ]
      },
      {
        id: 'que_hacer',
        title: "¿Qué puedes hacer tú para mejorar?",
        content: [
          "Evita acostarte justo después de comer. Espera al menos 2 horas antes de tumbarte o irte a dormir.",
          "Evita las comidas muy copiosas, especialmente por la noche.",
          "Eleva el cabecero de la cama si tienes molestias al dormir (puedes usar un alza o cuñas, no solo almohadas).",
          "Reduce o elimina el tabaco y el alcohol, ya que pueden irritar la mucosa y empeorar el reflujo.",
          "Pierde peso si tienes sobrepeso, ya que está demostrado que mejora los síntomas y favorece el control del reflujo."
        ]
      },
      {
        id: 'seguimiento_medico',
        title: "¿Y el tratamiento médico?",
        content: "Esta condición requiere un seguimiento profesional y posible tratamiento con medicación específica, indicado por tu médico. Si no estás en tratamiento actualmente o tienes síntomas persistentes, te recomendamos consultar lo antes posible con tu especialista."
      }
    ]
  },
  // Bloque 2 - ERGE No Erosiva (🟨)
  2: {
    title: "ERGE No Erosiva (NERD)",
    sections: [
      {
        id: 'que_significa',
        title: "¿Qué significa tu perfil?",
        content: "Tienes síntomas claros de reflujo, pero tu endoscopia no muestra lesiones visibles en el esófago. Sin embargo, las pruebas funcionales como la pH-metría han detectado una exposición anormal al reflujo ácido. Esto se conoce como ERGE no erosiva o NERD, y es una forma muy frecuente de reflujo."
      },
      {
        id: 'por_que_importante',
        title: "¿Por qué es importante tenerlo en cuenta?",
        content: [
          "Aunque no haya daño visible, los síntomas pueden ser igual de molestos o incapacitantes que en otros tipos de reflujo.",
          "Muchas veces, este tipo de reflujo no responde del todo a la medicación y requiere una atención especial a los hábitos diarios.",
          "Es importante no subestimar este perfil, ya que un buen manejo puede mejorar mucho tu calidad de vida."
        ]
      },
      {
        id: 'que_hacer',
        title: "¿Qué puedes hacer tú para mejorar?",
        content: [
          "Evita las comidas muy abundantes, especialmente si vas a estar inactivo o tumbado después.",
          "No te acuestes inmediatamente después de comer. Espera al menos dos horas.",
          "Reduce el consumo de tabaco y alcohol, si los tomas.",
          "Si tienes sobrepeso, perder algo de peso puede ayudarte mucho con los síntomas.",
          "Elevar ligeramente el cabecero de la cama puede ayudarte si tienes molestias por la noche."
        ]
      },
      {
        id: 'seguimiento_medico',
        title: "¿Y el seguimiento médico?",
        content: "Aunque tu endoscopia sea normal, es importante que sigas en contacto con tu médico si los síntomas persisten o interfieren con tu día a día. En algunos casos puede ser necesario ajustar el enfoque terapéutico o realizar seguimiento adicional."
      }
    ]
  },
  // Bloque 3 - Reflujo Extraesofágico (🟦)
  3: {
    title: "Reflujo Extraesofágico",
    sections: [
      {
        id: 'que_significa',
        title: "¿Qué significa tu perfil?",
        content: "Tus síntomas se relacionan con la garganta o el aparato respiratorio superior: carraspeo, ronquera, tos crónica, sensación de cuerpo extraño, etc. Estos casos se asocian con lo que se conoce como reflujo extraesofágico o \"reflujo silencioso\"."
      },
      {
        id: 'por_que_importante',
        title: "¿Por qué es importante entenderlo?",
        content: [
          "Este tipo de reflujo no siempre causa ardor o molestias típicas, por eso puede pasar desapercibido.",
          "A veces se relaciona con el ascenso de pequeñas cantidades de ácido o contenido gástrico hacia la zona de la laringe o faringe.",
          "Según la guía clínica, la relación entre estos síntomas y el reflujo no siempre está clara, pero muchos pacientes mejoran al modificar sus hábitos."
        ]
      },
      {
        id: 'que_hacer',
        title: "¿Qué puedes hacer tú para mejorar?",
        content: [
          "Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 2–3 horas antes de acostarte.",
          "No te tumbes inmediatamente después de comer.",
          "Evita comidas que notes que aumentan la mucosidad o el carraspeo.",
          "Si tienes síntomas nocturnos, puede ayudar elevar ligeramente el cabecero de la cama.",
          "Reducir el alcohol y el tabaco, si están presentes, también puede ser beneficioso."
        ]
      },
      {
        id: 'seguimiento_medico',
        title: "¿Y el seguimiento médico?",
        content: "La guía recomienda que si estos síntomas persisten, puede ser útil una evaluación adicional por otorrinolaringología o neumología, especialmente si no hay mejora tras cambios en el estilo de vida. Habla con tu médico si los síntomas se mantienen o interfieren en tu vida diaria."
      }
    ]
  },
  // Bloque 4 - Perfil Funcional/Hipersensibilidad (🟪)
  4: {
    title: "Perfil Funcional/Hipersensibilidad",
    sections: [
      {
        id: 'que_significa',
        title: "¿Qué significa tu perfil?",
        content: "En tu caso, las pruebas digestivas realizadas no han mostrado reflujo ácido excesivo ni lesiones en el esófago. Aun así, los síntomas persisten. Esto puede deberse a una mayor sensibilidad del esófago o a una alteración funcional en la forma en la que tu cuerpo percibe ciertos estímulos. Es lo que se conoce como hipersensibilidad esofágica o pirosis funcional."
      },
      {
        id: 'por_que_importante',
        title: "¿Por qué es importante entenderlo?",
        content: [
          "Este tipo de diagnóstico no indica que no tengas nada: tus síntomas son reales, pero no se deben a un daño físico visible.",
          "En estos casos, la guía clínica destaca que lo más útil es la educación y el abordaje desde el estilo de vida, más que tratamientos farmacológicos intensivos.",
          "Factores como el estrés, la ansiedad, o incluso experiencias digestivas pasadas pueden influir en cómo percibes las molestias."
        ]
      },
      {
        id: 'que_hacer',
        title: "¿Qué puedes hacer tú para mejorar?",
        content: [
          "Mantener horarios de comida regulares y evitar saltarte comidas.",
          "Comer tranquilo y sin distracciones, permitiendo que tu cuerpo digiera de forma natural.",
          "Evitar comidas excesivas o muy rápidas, ya que pueden aumentar la sensación de malestar.",
          "Si identificas algún alimento que te genera síntomas, puedes evitarlo, pero no es necesario restringir de forma estricta si no hay una causa clara."
        ]
      },
      {
        id: 'seguimiento_medico',
        title: "¿Y el seguimiento médico?",
        content: "Este tipo de diagnóstico suele confirmarse tras haber descartado otras causas mediante pruebas. Si no te has hecho una evaluación completa aún, coméntaselo a tu médico. Y si ya estás en seguimiento, puede ser útil complementar el abordaje con estrategias enfocadas en el bienestar digestivo y emocional."
      }
    ]
  },
  // Bloque 5 - Síntomas sin pruebas diagnósticas (🟫)
  5: {
    title: "Síntomas sin Pruebas",
    sections: [
      {
        id: 'que_significa',
        title: "¿Qué significa tu perfil?",
        content: "Tienes síntomas compatibles con reflujo gastroesofágico o molestias relacionadas, pero aún no te has hecho pruebas digestivas específicas. Esto no significa que no haya un problema, pero sí que aún no se ha podido confirmar el tipo exacto de reflujo o su causa concreta."
      },
      {
        id: 'por_que_importante',
        title: "¿Por qué es importante tenerlo en cuenta?",
        content: [
          "La guía clínica indica que, si no hay signos de alarma, no es necesario hacer pruebas de inmediato.",
          "Muchas personas mejoran significativamente al aplicar estrategias de estilo de vida, incluso antes de iniciar un tratamiento específico.",
          "Aun así, si los síntomas persisten o aumentan, consultar con un médico es clave para avanzar en el diagnóstico."
        ]
      },
      {
        id: 'que_hacer',
        title: "¿Qué puedes hacer tú para mejorar?",
        content: [
          "Evita comidas copiosas, especialmente por la noche.",
          "No te tumbes justo después de comer. Espera al menos 2 horas.",
          "Si tienes sobrepeso, perder algo de peso puede ayudarte.",
          "Evita alimentos o bebidas que claramente notes que te sientan mal. No es necesario eliminarlos todos si no hay una relación evidente.",
          "Elevar ligeramente el cabecero de la cama puede ser útil si tienes molestias nocturnas.",
          "Evita el tabaco y reduce el alcohol, si están presentes en tu día a día."
        ]
      },
      {
        id: 'seguimiento_medico',
        title: "¿Y el seguimiento médico?",
        content: "Si tus síntomas son persistentes, afectan a tu calidad de vida o no mejoras tras aplicar estas medidas, consulta con tu médico de cabecera o especialista en digestivo. Puede valorar si es necesario hacer una prueba como la endoscopia o la pH-metría para conocer mejor tu caso."
      }
    ]
  },
  // Bloque 6 - Sin síntomas ni pruebas relevantes (⚪)
  6: {
    title: "Bienestar Digestivo",
    sections: [
      {
        id: 'que_significa',
        title: "¿Qué significa tu perfil?",
        content: "Según tus respuestas, no se detectan síntomas típicos de reflujo ni molestias digestivas relevantes en este momento. Tampoco hay constancia de pruebas digestivas con hallazgos que indiquen un problema activo."
      },
      {
        id: 'por_que_importante',
        title: "¿Por qué es útil conocer esto?",
        content: [
          "No tener síntomas ahora no significa que no debas cuidar tu digestión.",
          "Prestar atención a tus hábitos puede ayudarte a mantener una buena salud digestiva a largo plazo.",
          "Si en algún momento notas molestias, sabrás qué observar y cómo actuar de forma preventiva."
        ]
      },
      {
        id: 'que_hacer',
        title: "¿Qué puedes hacer tú para mantener una buena salud digestiva?",
        content: [
          "Come tranquilo, sin prisas ni distracciones.",
          "Evita comidas excesivas o muy tardías, especialmente si vas a acostarte después.",
          "Mantén horarios regulares y una alimentación variada, según tu tolerancia.",
          "Haz actividad física moderada a diario.",
          "Hidrátate bien, pero sin excesos durante las comidas.",
          "Intenta no fumar y limitar el alcohol, si lo consumes."
        ]
      },
      {
        id: 'seguimiento_medico',
        title: "¿Y si en algún momento aparecen síntomas?",
        content: "Si en el futuro experimentas ardor, acidez, molestias digestivas, tos persistente o sensación de reflujo, te recomendamos repetir los cuestionarios y valorar una consulta médica si los síntomas persisten."
      }
    ]
  }
};

// Contenido condicional para factores clínicos con iconos
const CLINICAL_FACTORS_CONTENT = {
  hernia: {
    icon: <FontAwesome5 name="stomach" size={24} color="#0077B6" />,
    title: "Hernia de hiato o cardias incompetente",
    content: "La hernia de hiato puede debilitar la barrera que separa el estómago del esófago, facilitando que los ácidos asciendan con más facilidad. Esto puede estar influyendo en tus síntomas. En tu caso, trabajar la respiración diafragmática y cuidar la postura abdominal puede ayudarte.",
    tools: "Respiración diafragmática, posturas correctas, evitar presión abdominal."
  },
  motility: {
    icon: <MaterialIcons name="moving" size={24} color="#0077B6" />,
    title: "Motilidad esofágica alterada",
    content: "Algunas personas tienen alteraciones en la forma en la que el esófago empuja los alimentos hacia el estómago. Si este movimiento está debilitado, el ácido puede quedar más tiempo en el esófago. Masticar bien, comer despacio y evitar mezclar alimentos sólidos con bebidas frías puede ayudarte.",
    tools: "Alimentación suave, registro de sensaciones, técnicas de masticación."
  },
  emptying: {
    icon: <Ionicons name="hourglass-outline" size={24} color="#0077B6" />,
    title: "Vaciamiento gástrico lento (gastroparesia)",
    content: "Cuando el estómago tarda mucho en vaciarse, aumenta la presión interna y eso puede favorecer el reflujo. En tu caso, hacer comidas pequeñas, repartidas y con bajo contenido graso puede ayudarte a sentirte mejor.",
    tools: "Comidas fraccionadas, pautas de vaciamiento, control de volumen."
  },
  saliva: {
    icon: <Ionicons name="water-outline" size={24} color="#0077B6" />,
    title: "Salivación reducida / sequedad bucal",
    content: "La saliva ayuda a neutralizar el ácido que asciende al esófago. Si tienes poca salivación, el aclaramiento natural se debilita. Beber agua a lo largo del día, evitar el tabaco y revisar efectos secundarios de medicamentos puede ser clave para mejorar.",
    tools: "Hidratación adecuada, higiene bucal, evitar alcohol/tabaco."
  },
  constipation: {
    icon: <MaterialIcons name="pending-actions" size={24} color="#0077B6" />,
    title: "Estreñimiento o esfuerzo al defecar",
    content: "El estreñimiento aumenta la presión abdominal y puede empeorar el reflujo. Mejorar tu evacuación puede tener un impacto positivo. Te recomendamos hidratarte bien, incluir fibra y usar un taburete para adoptar una mejor postura al defecar.",
    tools: "Aumento de fibra, uso de taburete, hidratación adecuada, actividad física."
  },
  stress_yes: {
    icon: <MaterialIcons name="psychology" size={24} color="#0077B6" />,
    title: "Estrés o ansiedad como agravantes",
    content: "El estrés puede hacer que el cuerpo esté más sensible a los estímulos digestivos. Muchas personas sienten que sus síntomas aumentan en periodos de tensión. Trabajar el bienestar emocional también es parte del cuidado digestivo.",
    tools: "Respiración consciente, relajación guiada, diario emocional."
  },
  stress_sometimes: {
    icon: <MaterialIcons name="psychology-alt" size={24} color="#0077B6" />,
    title: "Manejo ocasional del estrés",
    content: "Notas que a veces el estrés influye en tus síntomas digestivos. Esto es normal y parte de la conexión mente-intestino. Tener algunas estrategias básicas de manejo del estrés puede ser beneficioso para tu bienestar digestivo.",
    tools: "Técnicas de relajación básicas, mindfulness simple."
  },
  bmi_high: {
    icon: <MaterialIcons name="monitor-weight" size={24} color="#0077B6" />,
    title: "El peso y tus síntomas digestivos",
    content: "Tu índice de masa corporal (IMC) sugiere que podrías tener un exceso de peso corporal. Esto no es una crítica, sino una información relevante que puede ayudarte a entender mejor tus síntomas digestivos. El exceso de peso abdominal puede aumentar la presión en el estómago y favorecer el reflujo. Por eso, una pequeña mejora en tu composición corporal puede tener un gran impacto positivo.",
    tools: "Plan de movimiento moderado, pautas alimentarias progresivas, seguimiento de hábitos digestivos."
  }
};

const { width } = Dimensions.get('window');

export default function ProgramDetailsScreen() {
  const navigation = useNavigation<ProgramDetailsNavigationProp>();
  const [userProgram, setUserProgram] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [priorityRecommendations, setPriorityRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  
  // Cargar datos del programa
  useEffect(() => {
    const fetchProgramData = async () => {
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
        // Cargar datos del perfil
        const profileResponse = await api.get('/api/profiles/me/');
        
        if (profileResponse.data) {
          if (profileResponse.data.first_name) {
            setUserName(profileResponse.data.first_name);
          } else if (profileResponse.data.username) {
            setUserName(profileResponse.data.username);
          }
        }
        
        // Cargar el programa asignado
        const programResponse = await api.get('/api/programs/my-program/');
        
        if (programResponse.data) {
          console.log("Programa cargado:", programResponse.data);
          setUserProgram(programResponse.data);
        }
        
        // Cargar recomendaciones prioritarias
        const priorityResponse = await api.get('/api/recommendations/prioritized/');
        
        if (priorityResponse.data) {
          console.log("Recomendaciones prioritarias:", priorityResponse.data);
          setPriorityRecommendations(priorityResponse.data);
        }
        
        // Cargar todas las recomendaciones
        const allRecommendationsResponse = await api.get('/api/recommendations/');
        
        if (allRecommendationsResponse.data) {
          console.log("Todas las recomendaciones:", allRecommendationsResponse.data);
          setRecommendations(allRecommendationsResponse.data);
        }
      } catch (err) {
        console.error("Error al cargar datos del programa:", err);
        
        if (err.response && err.response.status === 404) {
          setError("No se encontró un programa asignado");
        } else {
          setError("Error al cargar los detalles del programa");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgramData();
  }, [navigation]);
  
  // Obtener el bloque del programa basado en el perfil
  const getProgramBlock = () => {
    if (!userProgram || !userProgram.profile_data) return null;
    
    const { display_block } = userProgram.profile_data;
    
    // Si no hay bloque específico, usar uno por defecto
    if (!display_block || !PROGRAM_BLOCKS[display_block]) {
      return 6; // Bloque de bienestar digestivo por defecto
    }
    
    return display_block;
  };
  
  // Alternar expandir/colapsar sección
  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  // Obtener contenido de factores clínicos adicionales
  const getClinicalFactorsContent = () => {
    if (!userProgram || !userProgram.profile_data) return [];
    
    const {
      has_hernia, 
      has_altered_motility, 
      has_slow_emptying,
      has_dry_mouth,
      has_constipation,
      stress_affects,
      has_excess_weight
    } = userProgram.profile_data;
    
    const factors = [];
    
    if (has_hernia === 'YES') {
      factors.push(CLINICAL_FACTORS_CONTENT.hernia);
    }
    
    if (has_altered_motility === 'YES') {
      factors.push(CLINICAL_FACTORS_CONTENT.motility);
    }
    
    if (has_slow_emptying === 'YES') {
      factors.push(CLINICAL_FACTORS_CONTENT.emptying);
    }
    
    if (has_dry_mouth === 'YES') {
      factors.push(CLINICAL_FACTORS_CONTENT.saliva);
    }
    
    if (has_constipation === 'YES') {
      factors.push(CLINICAL_FACTORS_CONTENT.constipation);
    }
    
    if (stress_affects === 'YES') {
      factors.push(CLINICAL_FACTORS_CONTENT.stress_yes);
    } else if (stress_affects === 'SOMETIMES') {
      factors.push(CLINICAL_FACTORS_CONTENT.stress_sometimes);
    }
    
    if (has_excess_weight) {
      factors.push(CLINICAL_FACTORS_CONTENT.bmi_high);
    }
    
    return factors;
  };
  
  // Renderizar una lista con viñetas
  const renderBulletList = (items) => {
    if (!Array.isArray(items)) {
      return <Text style={styles.listText}>{items}</Text>;
    }
    
    return (
      <View style={styles.listContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={18} color="#0077B6" />
            </View>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Marcar recomendación como leída
  const markRecommendationAsRead = async (recommendationId: number) => {
    try {
      await api.patch(`/api/recommendations/${recommendationId}/`, {
        is_read: true
      });
      
      // Actualizar estado local
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_read: true } 
            : rec
        )
      );
      
      setPriorityRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_read: true } 
            : rec
        )
      );
    } catch (err) {
      console.error("Error al marcar recomendación como leída:", err);
    }
  };
  
  // Alternar expandir/colapsar recomendación
  const toggleRecommendation = (id: number) => {
    if (expandedRecommendation === id) {
      setExpandedRecommendation(null);
    } else {
      setExpandedRecommendation(id);
      // Marcar como leída al expandir
      markRecommendationAsRead(id);
    }
  };
  
  // Renderizar una recomendación
  const renderRecommendation = (item: any, isPriority: boolean = false) => {
    const isExpanded = expandedRecommendation === item.id;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.recommendationCard,
          isPriority && styles.priorityCard,
          isExpanded && styles.expandedCard
        ]}
        onPress={() => toggleRecommendation(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.recommendationHeader}>
          {isPriority && (
            <View style={styles.priorityBadge}>
              <Ionicons name="star" size={14} color="#ffffff" />
              <Text style={styles.priorityText}>Prioridad</Text>
            </View>
          )}
          
          <Text 
            style={[
              styles.recommendationTitle, 
              !item.is_read && styles.unreadTitle
            ]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.recommendation.title}
          </Text>
          
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#0077B6" 
          />
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.recommendationContent}>
              {item.recommendation.content}
            </Text>
            
            {item.recommendation.tools && (
              <View style={styles.toolsSection}>
                <Text style={styles.toolsTitle}>Herramientas sugeridas:</Text>
                <Text style={styles.toolsContent}>{item.recommendation.tools}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  // Renderizar el contenido del programa
  const renderProgramContent = () => {
    const blockNumber = getProgramBlock();
    if (!blockNumber || !PROGRAM_BLOCKS[blockNumber]) return null;
    
    const programBlock = PROGRAM_BLOCKS[blockNumber];
    
    return (
      <View style={styles.programContentSection}>
        {/* Secciones del programa */}
        {programBlock.sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.programSectionCard,
              expandedSection === section.id && styles.expandedSectionCard
            ]}
            onPress={() => toggleSection(section.id)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                {SECTION_ICONS[section.id]}
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons 
                name={expandedSection === section.id ? "chevron-up" : "chevron-down"} 
                size={22} 
                color="#0077B6" 
              />
            </View>
            
            {expandedSection === section.id && (
              <View style={styles.sectionContent}>
                {renderBulletList(section.content)}
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {/* Factores clínicos adicionales */}
        {getClinicalFactorsContent().length > 0 && (
          <View style={styles.clinicalFactorsSection}>
            <Text style={styles.clinicalFactorsTitle}>
              Factores Clínicos Adicionales
            </Text>
            
            {getClinicalFactorsContent().map((factor, index) => (
              <View key={index} style={styles.clinicalFactorCard}>
                <View style={styles.factorHeader}>
                  <View style={styles.factorIconContainer}>
                    {factor.icon}
                  </View>
                  <Text style={styles.factorTitle}>{factor.title}</Text>
                </View>
                <Text style={styles.factorContent}>{factor.content}</Text>
                <View style={styles.factorToolsContainer}>
                  <Text style={styles.factorToolsTitle}>Herramientas sugeridas:</Text>
                  <Text style={styles.factorTools}>{factor.tools}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Recomendaciones prioritarias integradas en la misma sección */}
        {priorityRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>
              Recomendaciones Prioritarias
            </Text>
            <Text style={styles.recommendationsSubtitle}>
              Estas son las recomendaciones más importantes para tu caso particular
            </Text>
            
            {priorityRecommendations.map(recommendation => 
              renderRecommendation(recommendation, true)
            )}
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <HeaderComponent />
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando tu programa...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !userProgram ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Programa no encontrado</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setIsLoading(true)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Cabecera única y estilizada */}
          <View style={styles.programHeaderContainer}>
            <LinearGradient
              colors={['#00B4D8', '#0077B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.programHeader}
            >
              <View style={styles.programTitleContainer}>
                <View style={styles.rocketIconContainer}>
                  <Ionicons name="rocket" size={28} color="#ffffff" />
                </View>
                <Text style={styles.programTitle}>Tu Programa Personalizado</Text>
              </View>
            </LinearGradient>
          </View>
          
          {/* Contenido del programa con todas las secciones integradas */}
          {renderProgramContent()}
          
          {/* Iniciar seguimiento - Únicamente esta sección permanece como parte adicional */}
          <View style={styles.trackerSection}>
            <View style={styles.trackerIconContainer}>
              <Ionicons name="calendar-outline" size={28} color="#0077B6" />
            </View>
            <Text style={styles.trackerTitle}>Seguimiento de Hábitos</Text>
            <Text style={styles.trackerDescription}>
              Inicia el seguimiento de tus hábitos y síntomas para mejorar
              tu condición y recibir recomendaciones más personalizadas.
            </Text>
            
            <TouchableOpacity
              style={styles.startTrackerButton}
              onPress={() => navigation.navigate('Tracker')}
            >
              <Text style={styles.buttonText}>Iniciar Seguimiento</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      
      {/* Barra de navegación inferior */}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  // Cabecera única
  programHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    zIndex: 10,
  },
  programHeader: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  programTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rocketIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  programTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
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
  // Sección del contenido del programa - ampliada para incluir todas las secciones
  programContentSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    margin: 16,
    marginTop: -20, // Para superponerse a la cabecera
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  // Tarjetas de sección del programa
  programSectionCard: {
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
  expandedSectionCard: {
    backgroundColor: '#f0f7fa',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0077B6',
  },
  sectionContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  // Estilo para listas con viñetas
  listContainer: {
    marginVertical: 6,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 10,
  },
  bulletPoint: {
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  // Factores clínicos
  clinicalFactorsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 24,
  },
  clinicalFactorsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 16,
  },
  clinicalFactorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  factorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  factorTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0077B6',
  },
  factorContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  factorToolsContainer: {
    backgroundColor: 'rgba(0, 119, 182, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  factorToolsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 4,
  },
  factorTools: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  // Sección de recomendaciones integrada
  recommendationsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 8,
  },
  recommendationsSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
  },
  expandedCard: {
    backgroundColor: '#f0f7fa',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077B6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginRight: 10,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#0077B6',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recommendationContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  toolsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 119, 182, 0.05)',
    borderRadius: 8,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 6,
  },
  toolsContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Tracker section - estilizada y con icono
  trackerSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 16,
    marginTop: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  trackerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  trackerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 12,
    textAlign: 'center',
  },
  trackerDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  startTrackerButton: {
    backgroundColor: '#0077B6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  // Barra de navegación
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
    paddingHorizontal: 16,
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
    fontWeight: 'bold',
  },
  tabLabelInactive: {
    fontSize: 12,
    marginTop: 4,
    color: '#666666',
  },
});