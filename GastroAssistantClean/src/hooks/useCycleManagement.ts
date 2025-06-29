// src/hooks/useCycleManagement.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usar los tipos compartidos
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CycleStatus {
  needsRenewal: boolean;
  currentCycle: any | null;
  daysRemaining: number;
  daysElapsed: number;
  hasCompletedOnboarding: boolean;
  loading: boolean;
  error: string | null;
}

export const useCycleManagement = () => {
  const navigation = useNavigation<NavigationProp>();
  const [cycleStatus, setCycleStatus] = useState<CycleStatus>({
    needsRenewal: false,
    currentCycle: null,
    daysRemaining: 0,
    daysElapsed: 0,
    hasCompletedOnboarding: false,
    loading: true,
    error: null
  });

  const checkCycleStatus = useCallback(async () => {
    try {
      setCycleStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.get('/api/cycles/check-status/');
      
      setCycleStatus({
        needsRenewal: response.data.needs_renewal,
        currentCycle: response.data.current_cycle,
        daysRemaining: response.data.days_remaining,
        daysElapsed: response.data.days_elapsed,
        hasCompletedOnboarding: response.data.has_completed_onboarding,
        loading: false,
        error: null
      });

      // Si necesita renovación y no hay ciclo activo sin onboarding
      if (response.data.needs_renewal && !response.data.current_cycle) {
        // Crear nuevo ciclo automáticamente
        await startNewCycle();
      }
    } catch (error: any) {
      console.error('Error checking cycle status:', error);
      setCycleStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.error || 'Error al verificar el estado del ciclo'
      }));
    }
  }, []);

  const startNewCycle = async () => {
    try {
      const response = await api.post('/api/cycles/start-new/');
      
      console.log('Nuevo ciclo creado:', response.data);
      
      // Actualizar el estado con el nuevo ciclo
      setCycleStatus(prev => ({
        ...prev,
        currentCycle: response.data.cycle,
        needsRenewal: false,
        hasCompletedOnboarding: false
      }));
      
      // Verificar si es el primer ciclo o no
      const cycleNumber = response.data.cycle.cycle_number;
      
      if (cycleNumber === 1) {
        // Primer ciclo: onboarding completo
        navigation.navigate('OnboardingWelcome');
      } else {
        // Ciclos posteriores: ir directo a la actualización de datos
        (navigation as any).navigate('OnboardingGeneralUpdate', { isRenewal: true });
      }
    } catch (error: any) {
      console.error('Error starting new cycle:', error);
      setCycleStatus(prev => ({ 
        ...prev, 
        error: error.response?.data?.error || 'Error al iniciar nuevo ciclo'
      }));
    }
  };

  useEffect(() => {
    checkCycleStatus();
  }, [checkCycleStatus]);

  return {
    ...cycleStatus,
    checkCycleStatus,
    startNewCycle
  };
};