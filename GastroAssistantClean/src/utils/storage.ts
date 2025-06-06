// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function storeData(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
    console.log(`✅ Datos guardados: ${key}`);
  } catch (error) {
    console.error('Error al guardar datos:', error);
    throw error;
  }
}

export async function getData(key: string): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return null;
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🧹 Datos eliminados: ${key}`);
  } catch (error) {
    console.error('Error al eliminar datos:', error);
  }
}

// Reemplaza la función getOnboardingProgress existente por esta:
export async function getOnboardingProgress(): Promise<string | null> {
  try {
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