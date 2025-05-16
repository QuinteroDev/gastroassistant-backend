// utils/storage.ts
// Utilitario para manejar almacenamiento en diferentes plataformas

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Almacena un valor de forma segura.
 * En plataformas nativas usa SecureStore, en web usa localStorage.
 */
export async function storeData(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // En web usamos localStorage
      localStorage.setItem(key, value);
      return Promise.resolve();
    } else {
      // En iOS/Android usamos SecureStore
      return await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('Error al guardar datos:', error);
    throw error;
  }
}

/**
 * Recupera un valor almacenado.
 * En plataformas nativas usa SecureStore, en web usa localStorage.
 */
export async function getData(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // En web usamos localStorage
      const value = localStorage.getItem(key);
      return Promise.resolve(value);
    } else {
      // En iOS/Android usamos SecureStore
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return null;
  }
}

/**
 * Elimina un valor almacenado.
 * En plataformas nativas usa SecureStore, en web usa localStorage.
 */
export async function removeData(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // En web usamos localStorage
      localStorage.removeItem(key);
      return Promise.resolve();
    } else {
      // En iOS/Android usamos SecureStore
      return await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error al eliminar datos:', error);
    throw error;
  }
}

/**
 * Comprueba si hay un token de autenticación guardado.
 * Útil para determinar el estado de inicio de sesión.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getData('authToken');
    return token !== null && token !== '';
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    return false;
  }
}

/**
 * Guarda múltiples valores en un solo objeto.
 * Útil para almacenar datos de usuario completos.
 */
export async function storeMultipleData(data: Record<string, string>): Promise<void> {
  try {
    const promises = Object.entries(data).map(([key, value]) => {
      return storeData(key, value);
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error al guardar múltiples datos:', error);
    throw error;
  }
}

/**
 * Guarda la pantalla actual del onboarding
 * @param {string} screenName - Nombre de la pantalla de onboarding
 */
export async function saveOnboardingProgress(screenName: string): Promise<void> {
  try {
    // Obtener el ID de usuario o username para hacer el almacenamiento específico
    const username = await getData('username');
    const key = username ? `onboardingScreen_${username}` : 'onboardingScreen';
    
    await storeData(key, screenName);
    console.log(`✅ Progreso de onboarding guardado: ${screenName} para ${username || 'usuario actual'}`);
  } catch (error) {
    console.error('Error al guardar progreso de onboarding:', error);
  }
}

/**
 * Obtiene la última pantalla de onboarding visitada
 * @returns {Promise<string|null>} - Nombre de la pantalla o null si no hay
 */
export async function getOnboardingProgress(): Promise<string | null> {
  try {
    // Obtener el ID de usuario o username para hacer la recuperación específica
    const username = await getData('username');
    const key = username ? `onboardingScreen_${username}` : 'onboardingScreen';
    
    const screen = await getData(key);
    console.log(`📱 Recuperando progreso de onboarding: ${screen || 'No hay progreso guardado'} para ${username || 'usuario actual'}`);
    return screen;
  } catch (error) {
    console.error('Error al obtener progreso de onboarding:', error);
    return null;
  }
}

/**
 * Elimina el progreso de onboarding (para cuando se completa)
 */
export async function clearOnboardingProgress(): Promise<void> {
  try {
    const username = await getData('username');
    const key = username ? `onboardingScreen_${username}` : 'onboardingScreen';
    
    await removeData(key);
    console.log(`🧹 Progreso de onboarding eliminado para ${username || 'usuario actual'}`);
  } catch (error) {
    console.error('Error al eliminar progreso de onboarding:', error);
  }
}