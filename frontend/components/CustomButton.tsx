// components/CustomButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  iconPosition?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  isLoading = false,
  disabled = false,
  type = 'primary',
  icon,
  iconPosition = 'left',
  size = 'medium'
}) => {
  
  // Determinar los colores del gradiente según el tipo
  const getGradientColors = () => {
    switch (type) {
      case 'primary':
        return ['#0077B6', '#00B4D8'];
      case 'secondary':
        return ['#023E8A', '#0077B6'];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return ['#0077B6', '#00B4D8'];
    }
  };

  // Determinar el tamaño del ícono basado en la propiedad size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  // Estilos dinámicos basados en tamaño
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          fontSize: 14,
          borderRadius: 8,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
          borderRadius: 10,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          fontSize: 18,
          borderRadius: 12,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
          borderRadius: 10,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Renderizar el contenido del botón
  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color={type === 'outline' ? '#0077B6' : '#FFFFFF'} />;
    }

    const iconComponent = icon ? (
      <Ionicons 
        name={icon as any} 
        size={getIconSize()} 
        color={type === 'outline' ? '#0077B6' : '#FFFFFF'} 
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight} 
      />
    ) : null;

    return (
      <>
        {icon && iconPosition === 'left' && iconComponent}
        <Text 
          style={[
            styles.buttonText, 
            type === 'outline' && styles.outlineText,
            { fontSize: sizeStyles.fontSize },
            textStyle
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && iconComponent}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderRadius: sizeStyles.borderRadius },
        type === 'outline' && styles.outlineButton,
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {type === 'outline' ? (
        renderContent()
      ) : (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientContainer,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.borderRadius
            }
          ]}
        >
          {renderContent()}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradientContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#0077B6',
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineText: {
    color: '#0077B6',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  }
});

export default CustomButton;