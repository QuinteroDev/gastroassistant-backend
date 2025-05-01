
// types/navigation.ts
export type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
    Profile: undefined;
    Settings: undefined;
    OnboardingDiagnosticTests: undefined;
    PhenotypeResult: undefined;
    ProgramDetails: { programId: string } | undefined;
    // Añade aquí más rutas según sea necesario
  };