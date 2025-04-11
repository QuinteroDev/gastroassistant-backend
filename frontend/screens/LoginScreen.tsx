// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp
} from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../App';
import CustomButton from '../components/CustomButton'; // ← nuestro botón
// ↑ Asegúrate de tener la carpeta `components/CustomButton.tsx`
import AsyncStorage from '@react-native-async-storage/async-storage';


type LoginScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
  
    try {
      const response = await fetch('http://192.168.1.48:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Error al iniciar sesión');
        return;
      }
  
      const data = await response.json();
      const token = data.token;
      // Guardamos el token en AsyncStorage (o SecureStore):
      await AsyncStorage.setItem('authToken', token);
  
      // Vamos a la pantalla Home:
      navigation.navigate('Home');
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={['#00BFA6', '#0096C7']}
      style={styles.gradientContainer}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Gastro Assistant</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <CustomButton title="Entrar" onPress={handleLogin} />

        <TouchableOpacity style={styles.linkContainer} onPress={goToRegister}>
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: '#ffffffcc', // blanco semi-transparente
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    // Sombras en iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Sombras en Android
    elevation: 5,
  },
  title: {
    fontSize: 24,
    marginBottom: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 8,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  linkContainer: {
    marginTop: 10,
  },
  linkText: {
    color: '#0077B6',
    textDecorationLine: 'underline',
  },
});
