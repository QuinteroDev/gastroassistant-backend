// src/components/CycleRenewalModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../constants/theme';

interface CycleRenewalModalProps {
  visible: boolean;
  daysRemaining: number;
  onStartRenewal: () => void;
  onRemindLater?: () => void;
}

const CycleRenewalModal: React.FC<CycleRenewalModalProps> = ({
  visible,
  daysRemaining,
  onStartRenewal,
  onRemindLater
}) => {
  const isUrgent = daysRemaining <= 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onStartRenewal}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Icon 
              name={isUrgent ? "calendar" : "calendar-outline"} 
              size={50} 
              color="#FFFFFF" 
            />
          </View>
          
          <Text style={styles.title}>
            {isUrgent ? '¡Es hora de tu evaluación mensual!' : 'Tu ciclo está por terminar'}
          </Text>
          
          <Text style={styles.message}>
            {isUrgent 
              ? 'Han pasado 30 días desde tu última evaluación. Es importante que realices una nueva para ajustar tu programa y continuar mejorando.'
              : `Quedan ${daysRemaining} días para completar tu ciclo actual. Prepárate para tu próxima evaluación.`
            }
          </Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Icon name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>5-10 minutos</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>Evaluación rápida</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onStartRenewal}
          >
            <Text style={styles.primaryButtonText}>
              Comenzar evaluación
            </Text>
          </TouchableOpacity>
          
          {!isUrgent && onRemindLater && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onRemindLater}
            >
              <Text style={styles.secondaryButtonText}>
                Recordarme más tarde
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '85%',
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  button: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: theme.fontSize.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.base,
    textAlign: 'center',
  },
});

export default CycleRenewalModal;