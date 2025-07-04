// App.tsx - VERSIÓN CON DEEP LINKS
import React from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';  // ← AÑADIR LinkingOptions
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ProgramDetailsScreen from './src/screens/ProgramDetailsScreen';
import OnboardingWelcomeScreen from './src/screens/OnboardingWelcomeScreen';
import OnboardingGeneralScreen from './src/screens/OnboardingGeneralScreen';
import OnboardingGeneralUpdateScreen from './src/screens/OnboardingGeneralUpdateScreen';
import OnboardingGerdQScreen from './src/screens/OnboardingGerdQScreen';
import OnboardingRsiScreen from './src/screens/OnboardingRsiScreen';
import OnboardingClinicalFactorsScreen from './src/screens/OnboardingClinicalFactorsScreen';
import OnboardingDiagnosticTestsScreen from './src/screens/OnboardingDiagnosticTestsScreen';
import OnboardingHabitsScreen from './src/screens/OnboardingHabitsScreen';
import GeneratingProgramScreen from './src/screens/GeneratingProgramScreen';
import TrackerScreen from './src/screens/TrackerScreen';
import EducationalContentScreen from './src/screens/EducationalContentScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import HelpCenterScreen from './src/screens/HelpCenterScreen';
import ProfileUpdateScreen from './src/screens/ProfileUpdateScreen';

// Habilitar react-native-screens
enableScreens();

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
  OnboardingGeneralUpdate: undefined;
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
  ChangePassword: undefined;
  HelpCenter: undefined;
  ProfileUpdate: undefined;
};

// ✅ AÑADIR CONFIGURACIÓN DE DEEP LINKS
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['gastroassistant://'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token: string) => token,
        },
      },
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer linking={linking}>  {/* ← AÑADIR linking prop */}
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
        />
        
        {/* Main App Screens */}
        <Stack.Screen
          name="ProgramDetails"
          component={ProgramDetailsScreen}
        />
        
        {/* Onboarding Screens */}
        <Stack.Screen
          name="OnboardingWelcome"
          component={OnboardingWelcomeScreen}
        />
        <Stack.Screen
          name="OnboardingGeneral"
          component={OnboardingGeneralScreen}
        />
        <Stack.Screen
          name="OnboardingGeneralUpdate"
          component={OnboardingGeneralUpdateScreen}
        />
        <Stack.Screen
          name="OnboardingGerdQ"
          component={OnboardingGerdQScreen}
        />
        <Stack.Screen
          name="OnboardingRsi"
          component={OnboardingRsiScreen}
        />
        <Stack.Screen
          name="OnboardingClinicalFactors"
          component={OnboardingClinicalFactorsScreen}
        />
        <Stack.Screen
          name="OnboardingDiagnosticTests"
          component={OnboardingDiagnosticTestsScreen}
        />
        <Stack.Screen
          name="OnboardingHabits"
          component={OnboardingHabitsScreen}
        />
        <Stack.Screen
          name="GeneratingProgram"
          component={GeneratingProgramScreen}
        />
        
        {/* Other App Screens */}
        <Stack.Screen
          name="Tracker"
          component={TrackerScreen}
        />
        <Stack.Screen
          name="Education"
          component={EducationalContentScreen}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
        />
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenterScreen}
        />
        <Stack.Screen
          name="ProfileUpdate"
          component={ProfileUpdateScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}