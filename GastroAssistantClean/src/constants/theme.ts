// src/constants/theme.ts

// Paleta de colores base de GastroAssistant
const baseColors = {
    primary: '#184e76',      // Azul oscuro - Color principal
    secondary: '#6bb3de',    // Azul claro - Color secundario
    accent: '#f0b841',       // Amarillo/Naranja - Color de acento
    white: '#feffff',        // Blanco puro
    
    // Colores adicionales que ya estamos usando
    blue: {
      50: '#E6F7FF',
      100: '#CAF0F8',
      200: '#00B4D8',
      300: '#0096C7',
      400: '#0077B6',
      500: '#184e76',  // primary
      600: '#023E8A',
      700: '#005f73',
    },
    
    // Grises para UI
    gray: {
      50: '#F5F8FA',
      100: '#f8f9fa',
      200: '#f0f0f0',
      300: '#E0E0E0',
      400: '#999999',
      500: '#666666',
      600: '#333333',
    },
    
    // Colores semánticos
    success: {
      light: '#d4edda',
      main: '#28a745',
      dark: '#155724',
      bg: '#f0fff4',
    },
    
    warning: {
      light: '#fff8e6',
      main: '#FFC107',
      dark: '#FF6B00',
      text: '#856404',
    },
    
    error: {
      light: '#f8d7da',
      main: '#d32f2f',
      dark: '#721c24',
      bg: '#fff1f1',
    },
    
    info: {
      light: '#d1ecf1',
      main: '#17a2b8',
      dark: '#0c5460',
    },
  };
  
  // Sistema de colores semánticos para la aplicación
  export const colors = {
    // Colores principales
    primary: baseColors.primary,
    secondary: baseColors.secondary,
    accent: baseColors.accent,
    background: baseColors.gray[50],
    surface: baseColors.white,
    gray: baseColors.gray, 
    
    // Texto
    text: {
      primary: baseColors.gray[600],
      secondary: baseColors.gray[500],
      disabled: baseColors.gray[400],
      inverse: baseColors.white,
    },
    
    // Bordes
    border: {
      light: baseColors.gray[300],
      main: baseColors.gray[300],
      dark: baseColors.gray[400],
    },
    
    // Estados
    success: baseColors.success,
    warning: baseColors.warning,
    error: baseColors.error,
    info: baseColors.info,
    
    // Componentes específicos
    header: {
      background: baseColors.primary,
      text: baseColors.white,
      icon: baseColors.white,
    },
    
    tabBar: {
      background: baseColors.white,
      active: baseColors.primary,
      inactive: baseColors.gray[500],
      border: baseColors.gray[300],
    },
    
    card: {
      background: baseColors.white,
      border: baseColors.gray[200],
    },
    
    button: {
      primary: {
        background: baseColors.primary,
        text: baseColors.white,
        disabled: baseColors.gray[300],
      },
      secondary: {
        background: baseColors.secondary,
        text: baseColors.white,
      },
      accent: {
        background: baseColors.accent,
        text: baseColors.primary,
      },
    },
    
    input: {
      background: baseColors.gray[100],
      border: baseColors.gray[300],
      placeholder: baseColors.gray[400],
      text: baseColors.gray[600],
      focus: baseColors.primary,
      error: baseColors.error.main,
    },
    
    // Estados de hábitos
    habits: {
      notAchieved: baseColors.error.bg,
      partial: baseColors.warning.light,
      good: baseColors.secondary,
      excellent: baseColors.success.bg,
      promoted: baseColors.warning.dark,
    },
    
    // Gradientes sugeridos (para usar con react-native-linear-gradient si decides reinstalarlo)
    gradients: {
      primary: [baseColors.secondary, baseColors.primary],
      accent: [baseColors.accent, baseColors.warning.dark],
      success: [baseColors.success.main, baseColors.success.dark],
    },
  };
  
  // Espaciado
  export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };
  
  // Tamaños de fuente
  export const fontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    title: 32,
  };
  
  // Radios de borde
  export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  };
  
  // Sombras
  export const shadows = {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
  };
  
  // Función helper para obtener colores con opacidad
  export const withOpacity = (color: string, opacity: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Tema completo
  export const theme = {
    colors,
    spacing,
    fontSize,
    borderRadius,
    shadows,
  };
  
  export default theme;