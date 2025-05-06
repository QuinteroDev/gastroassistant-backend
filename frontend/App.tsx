// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

// Importaciones de pantallas existentes
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingWelcomeScreen from './screens/OnboardingWelcomeScreen'; 
import OnboardingGeneralScreen from './screens/OnboardingGeneralScreen';
import OnboardingGerdQScreen from './screens/OnboardingGerdQScreen';
import OnboardingRsiScreen from './screens/OnboardingRsiScreen';
import OnboardingClinicalFactorsScreen from './screens/OnboardingClinicalFactorsScreen';
import OnboardingDiagnosticTestsScreen from './screens/OnboardingDiagnosticTestsScreen';
import OnboardingHabitsScreen from './screens/OnboardingHabitsScreen';
import GeneratingProgramScreen from './screens/GeneratingProgramScreen';
import ProgramDetailsScreen from './screens/ProgramDetailsScreen';
import TrackerScreen from './screens/TrackerScreen';
import EducationalContentScreen from './screens/EducationalContentScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';


// Tipos para las rutas
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
  OnboardingGerdQ: undefined;
  OnboardingRsi: undefined;
  OnboardingClinicalFactors: undefined;
  OnboardingDiagnosticTests: undefined;
  OnboardingHabits: undefined;
  GeneratingProgram: undefined;
  ProgramDetails: undefined;
  Tracker: undefined;
  Education: undefined;
  Stats: undefined;
  Profile: undefined;
};

// Tipos de props para cada pantalla
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type OnboardingWelcomeScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingWelcome'>;
export type OnboardingGeneralScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingGeneral'>;
export type OnboardingGerdQScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingGerdQ'>;
export type OnboardingRsiScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingRsi'>;
export type OnboardingClinicalFactorsScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingClinicalFactors'>;
export type OnboardingDiagnosticTestsScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingDiagnosticTests'>;
export type OnboardingHabitsScreenProps = NativeStackScreenProps<RootStackParamList, 'OnboardingHabits'>;
export type GeneratingProgramScreenProps = NativeStackScreenProps<RootStackParamList, 'GeneratingProgram'>;
export type ProgramDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'ProgramDetails'>;
export type TrackerScreenProps = NativeStackScreenProps<RootStackParamList, 'Tracker'>;
export type EducationalContentScreenProps = NativeStackScreenProps<RootStackParamList, 'Education'>;
export type StatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Stats'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;


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
        {/* Pantallas de autenticación */}
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
        
        {/* Pantalla principal (ahora usando ProgramDetailsScreen) */}
        <Stack.Screen
          name="Home"
          component={ProgramDetailsScreen}
          options={{ headerShown: false }}
        />
        
        {/* Flujo de onboarding - Ordenado según la pantalla de bienvenida */}
        <Stack.Screen
          name="OnboardingWelcome"
          component={OnboardingWelcomeScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingGeneral"
          component={OnboardingGeneralScreen}
          options={{ 
            title: 'Información General',
            headerBackVisible: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingGerdQ"
          component={OnboardingGerdQScreen}
          options={{ 
            title: 'Cuestionario GerdQ',
            headerBackVisible: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingRsi"
          component={OnboardingRsiScreen}
          options={{ 
            title: 'Cuestionario RSI',
            headerBackVisible: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingClinicalFactors"
          component={OnboardingClinicalFactorsScreen}
          options={{ 
            title: 'Factores Clínicos',
            headerBackVisible: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingDiagnosticTests"
          component={OnboardingDiagnosticTestsScreen}
          options={{ 
            title: 'Pruebas Diagnósticas',
            headerBackVisible: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="OnboardingHabits"
          component={OnboardingHabitsScreen}
          options={{ 
            title: 'Cuestionario de Hábitos',
            headerBackVisible: false,
            gestureEnabled: false
          }}
        />
        
        {/* Pantallas de resultados y seguimiento */}
        <Stack.Screen
          name="GeneratingProgram"
          component={GeneratingProgramScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />
        
        {/* Mantenemos ProgramDetails como una ruta separada por si necesitamos 
            navegar a ella desde otros lugares que no sean Home */}
        <Stack.Screen
          name="ProgramDetails"
          component={ProgramDetailsScreen}
          options={{ 
            title: 'Mi Programa',
            headerBackVisible: true,
            gestureEnabled: true
          }}
        />
        
        <Stack.Screen
          name="Tracker"
          component={TrackerScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen
          name="Education"
          component={EducationalContentScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
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