// utils/api.ts
import axios from 'axios';
import { Platform } from 'react-native';
import { getData } from './storage'; // Importar el utilitario de almacenamiento multiplataforma

// Obtener la URL correcta según el entorno
const getBaseUrl = () => {
  // Verificar si estamos en desarrollo o producción
  if (__DEV__) {
    // DESARROLLO
    if (Platform.OS === 'web') {
      return 'http://127.0.0.1:8000';  // Localhost para web
    } else {
      // En dispositivos móviles/simuladores, usar la IP local
      return 'http://192.168.1.48:8000';  // Tu IP local
    }
  } else {
    // PRODUCCIÓN (TestFlight, App Store, etc.)
    return 'https://gastro.lymbia.com';
  }
};

// Crear una instancia configurada de axios
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos de timeout
});

// Log para depuración
console.log(`🚀 API configurada para usar: ${api.defaults.baseURL}`);
console.log(`📱 Entorno: ${__DEV__ ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
console.log(`💻 Plataforma: ${Platform.OS}`);

// Interceptor para añadir el token de autenticación a cada solicitud
api.interceptors.request.use(
  async (config) => {
    try {
      // Usar nuestro utilitario multiplataforma para obtener el token
      const token = await getData('authToken');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
        console.log('🔐 Token añadido a la solicitud');
      }
    } catch (error) {
      console.error('❌ Error al obtener el token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Respuesta exitosa desde: ${response.config.baseURL}`);
    return response;
  },
  (error) => {
    // Manejo de errores comunes
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('❌ Error de respuesta:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        console.error('🔑 Error de autenticación - Token inválido o expirado');
      }
    } else if (error.request) {
      // No se recibió respuesta del servidor
      console.error('🌐 Error de conexión (sin respuesta):', error.request);
      console.error('💡 Verifica que el servidor esté corriendo y la IP sea correcta');
    } else {
      // Error en la configuración de la solicitud
      console.error('⚙️ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;