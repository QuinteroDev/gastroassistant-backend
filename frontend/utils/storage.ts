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