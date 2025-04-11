// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp
} from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../App';
import CustomButton from '../components/CustomButton';

type RegisterScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleRegister = async () => {
    console.log('Se pulsó el botón "Crear cuenta"'); // DEPURACIÓN

    setError('');
    setMsg('');
  
    try {
      // Ajusta la URL según tu configuración:
      const response = await fetch('http://192.168.1.48:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
  
      if (!response.ok) {
        // Error (400, 500, etc.)
        const errorData = await response.json();
        setError(errorData.error || 'Error al registrar usuario');
        return;
      }


  
      // Si todo va bien (status 201 según tu backend):
      const data = await response.json();
      setMsg('¡Usuario registrado con éxito!');
  
      // Navegas a Login o Home:
      navigation.navigate('Login');
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    }
  };



  const goBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient
      colors={['#00BFA6', '#0096C7']}
      style={styles.gradientContainer}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Crear Cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <CustomButton title="Crear cuenta" onPress={handleRegister} />

        {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
        {msg ? <Text style={{ color: 'green' }}>{msg}</Text> : null}

        <TouchableOpacity style={styles.linkContainer} onPress={goBackToLogin}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
