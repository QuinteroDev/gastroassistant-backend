import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        if (disabled || loading) baseStyle.push(styles.primaryDisabled);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        if (disabled || loading) baseStyle.push(styles.secondaryDisabled);
        break;
      case 'accent':
        baseStyle.push(styles.accentButton);
        if (disabled || loading) baseStyle.push(styles.accentDisabled);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        if (disabled || loading) baseStyle.push(styles.outlineDisabled);
        break;
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'accent':
        baseStyle.push(styles.accentText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        if (disabled || loading) baseStyle.push(styles.outlineTextDisabled);
        break;
    }
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? theme.colors.primary : theme.colors.white} 
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  
  // Tamaños
  small: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Variantes - Botones
  primaryButton: {
    backgroundColor: theme.colors.button.primary.background,
  },
  primaryDisabled: {
    backgroundColor: theme.colors.button.primary.disabled,
  },
  
  secondaryButton: {
    backgroundColor: theme.colors.button.secondary.background,
  },
  secondaryDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  
  accentButton: {
    backgroundColor: theme.colors.button.accent.background,
  },
  accentDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  outlineDisabled: {
    borderColor: theme.colors.gray[300],
  },
  
  // Texto
  buttonText: {
    fontWeight: '600',
  },
  
  smallText: {
    fontSize: theme.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.fontSize.base,
  },
  largeText: {
    fontSize: theme.fontSize.lg,
  },
  
  // Variantes - Texto
  primaryText: {
    color: theme.colors.button.primary.text,
  },
  secondaryText: {
    color: theme.colors.button.secondary.text,
  },
  accentText: {
    color: theme.colors.button.accent.text,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  outlineTextDisabled: {
    color: theme.colors.gray[400],
  },
});

export default CustomButton;