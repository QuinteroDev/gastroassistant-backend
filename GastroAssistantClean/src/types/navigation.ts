// src/types/navigation.ts
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ProgramDetails: undefined;
  OnboardingWelcome: undefined;
  OnboardingGeneral: undefined;
  OnboardingGeneralUpdate: { isRenewal?: boolean } | undefined;  // ← ACTUALIZAR
  OnboardingGerdQ: { isRenewal?: boolean } | undefined;          // ← ACTUALIZAR
  OnboardingRsi: { isRenewal?: boolean } | undefined;            // ← ACTUALIZAR
  OnboardingClinicalFactors: undefined;
  OnboardingDiagnosticTests: undefined;
  OnboardingHabits: undefined;
  GeneratingProgram: undefined;
  Tracker: undefined;
  Education: undefined;
  Stats: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  HelpCenter: undefined;
  ProfileUpdate: undefined;
};