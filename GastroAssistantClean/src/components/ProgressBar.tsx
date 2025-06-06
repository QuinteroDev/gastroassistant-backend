// src/components/ProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showText?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  showText = true
}) => {
  // Calcular el porcentaje de progreso basado en pasos completados
  // currentStep - 1 representa los pasos ya completados
  const completedSteps = Math.max(0, currentStep - 1);
  const progressPercentage = (completedSteps / totalSteps) * 100;
    
  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progressPercentage}%` }
          ]}
        />
      </View>
            
      {showText && (
        <Text style={styles.progressText}>
          {`${Math.round(progressPercentage)}% completado`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    paddingBottom: 8,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0077B6',
    borderRadius: 6,
  },
  progressText: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 12,
    color: '#0077B6',
    fontWeight: '500',
  }
});

export default ProgressBar;