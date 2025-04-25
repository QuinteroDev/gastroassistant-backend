import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

// Importaciones de pantallas
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingGeneralScreen from './screens/OnboardingGeneralScreen';
import OnboardingGerdQScreen from './screens/OnboardingGerdQScreen';
import OnboardingRsiScreen from './screens/OnboardingRsiScreen'; // Nueva importación
import OnboardingHabitsScreen from './screens/OnboardingHabitsScreen'; // Nueva importación
import TrackerScreen from './screens/TrackerScreen'; // Nueva importación

// Tipos para las rutas
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  OnboardingGeneral: undefined;
  OnboardingGerdQ: undefined;
  OnboardingRsi: undefined;  // Nueva ruta
  OnboardingHabits: undefined;  // Nueva ruta
  Tracker: undefined;  // Nueva ruta
};

// Tipos de props para cada pantalla
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type OnboardingGeneralScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingGeneral'>;
export type OnboardingGerdQScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingGerdQ'>;
export type OnboardingRsiScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingRsi'>; // Nuevas props
export type OnboardingHabitsScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingHabits'>; // Nuevas props
export type TrackerScreenProps = NativeStackScreenProps<RootStackParamList, 'Tracker'>; // Nuevas props

const Stack = createNativeStackNavigator<RootStackParamList>();

// Componente inicial para eliminación garantizada del token
function InitialLoading({ setLoading }) {
  useEffect(() => {
    const prepareApp = async () => {
      try {
        // IMPORTANTE: Eliminar cualquier token existente para garantizar inicio en Login
        await SecureStore.deleteItemAsync('authToken');
        console.log("⚠️ Token eliminado para inicio limpio de la aplicación");
      } catch (error) {
        console.error("Error al limpiar token:", error);
      } finally {
        // Indicar que hemos terminado la carga inicial
        setTimeout(() => {
          setLoading(false);
        }, 500); // Pequeño retraso para asegurar que el token se limpió
      }
    };
    
    prepareApp();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0077B6" />
      <Text style={styles.loadingText}>Iniciando aplicación...</Text>
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Usar el componente de carga inicial que limpia el token
  if (isLoading) {
    return <InitialLoading setLoading={setIsLoading} />;
  }

  console.log("Iniciando aplicación con Login como pantalla inicial forzada");

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Registro' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Inicio' }}
        />
        <Stack.Screen
          name="OnboardingGeneral"
          component={OnboardingGeneralScreen}
          options={{ 
            title: 'Información General',
            // Prevenir que el usuario vuelva atrás al login con un gesto
            headerLeft: () => null,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingGerdQ"
          component={OnboardingGerdQScreen}
          options={{ 
            title: 'Cuestionario GerdQ',
            // Prevenir que el usuario vuelva atrás al paso anterior usando el botón
            headerBackVisible: false
          }}
        />
        <Stack.Screen
          name="OnboardingRsi"
          component={OnboardingRsiScreen}
          options={{ 
            title: 'Cuestionario RSI',
            // Prevenir que el usuario vuelva atrás al paso anterior usando el botón
            headerBackVisible: false
          }}
        />
        <Stack.Screen
          name="OnboardingHabits"
          component={OnboardingHabitsScreen}
          options={{ 
            title: 'Cuestionario de Hábitos',
            // Prevenir que el usuario vuelva atrás al paso anterior usando el botón
            headerBackVisible: false
          }}
        />
        <Stack.Screen
          name="Tracker"
          component={TrackerScreen}
          options={{ 
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F7FF'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0077B6',
  }
});