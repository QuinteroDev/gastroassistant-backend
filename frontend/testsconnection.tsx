// TestConnection.tsx
// Crear un componente simple para probar la conexión directa al backend

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

// URL directa al servidor
const SERVER_URL = 'http://192.168.1.48:8000';

export default function TestConnection() {
  const [result, setResult] = useState<string>('No se ha realizado ninguna prueba');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Función para añadir logs
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Función para probar la conexión directa al servidor
  const testDirectConnection = async () => {
    setIsLoading(true);
    setResult('Probando conexión...');
    addLog('Iniciando prueba de conexión directa');

    try {
      // Intentar conexión simple al servidor
      addLog(`Conectando a ${SERVER_URL}`);
      const response = await fetch(`${SERVER_URL}/admin/login/`, {
        method: 'GET',
      });

      addLog(`Respuesta recibida: Status ${response.status}`);
      
      if (response.ok) {
        setResult(`Conexión exitosa al servidor. Status: ${response.status}`);
        addLog('Conexión exitosa');
      } else {
        setResult(`Conexión al servidor, pero con error: ${response.status}`);
        addLog(`Error en respuesta: ${response.status}`);
      }
    } catch (error: any) {
      addLog(`Error de conexión: ${error.message}`);
      setResult(`Error de conexión: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para probar el login
  const testLogin = async () => {
    setIsLoading(true);
    setResult('Probando login...');
    addLog('Iniciando prueba de login');

    try {
      // Intentar login con credenciales de prueba
      addLog(`Conectando a ${SERVER_URL}/api/users/login/`);
      
      const response = await fetch(`${SERVER_URL}/api/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'usuario_prueba',
          password: 'contraseña_prueba',
        }),
      });

      addLog(`Respuesta de login recibida: Status ${response.status}`);
      
      // Obtener texto de respuesta
      const responseText = await response.text();
      addLog(`Respuesta texto: ${responseText}`);
      
      // Intentar parsear JSON si es posible
      try {
        const data = JSON.parse(responseText);
        addLog(`Respuesta JSON: ${JSON.stringify(data)}`);
        
        if (response.ok) {
          setResult(`Login respondió (aunque credenciales incorrectas). Status: ${response.status}`);
        } else {
          setResult(`Error en login: ${data.detail || data.error || response.status}`);
        }
      } catch (e) {
        addLog('No se pudo parsear la respuesta como JSON');
        setResult(`Respuesta no es JSON. Status: ${response.status}, Texto: ${responseText}`);
      }
    } catch (error: any) {
      addLog(`Error en test de login: ${error.message}`);
      setResult(`Error en test de login: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para probar CORS
  const testCORS = async () => {
    setIsLoading(true);
    setResult('Probando CORS...');
    addLog('Iniciando prueba de CORS');

    try {
      // Prueba con OPTIONS para verificar CORS
      addLog(`Enviando OPTIONS a ${SERVER_URL}/api/users/login/`);
      
      const response = await fetch(`${SERVER_URL}/api/users/login/`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:19006',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      addLog(`Respuesta OPTIONS: Status ${response.status}`);
      
      // Verificar headers CORS
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      };
      
      addLog(`Headers CORS: ${JSON.stringify(corsHeaders)}`);
      
      if (corsHeaders['Access-Control-Allow-Origin']) {
        setResult(`CORS configurado correctamente. Headers: ${JSON.stringify(corsHeaders)}`);
      } else {
        setResult(`Posible problema de CORS. Headers: ${JSON.stringify(corsHeaders)}`);
      }
    } catch (error: any) {
      addLog(`Error en prueba CORS: ${error.message}`);
      setResult(`Error en prueba CORS: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prueba de Conexión</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Probar Conexión Básica" 
          onPress={testDirectConnection} 
          disabled={isLoading} 
        />
        
        <Button 
          title="Probar Login" 
          onPress={testLogin} 
          disabled={isLoading} 
        />
        
        <Button 
          title="Probar CORS" 
          onPress={testCORS} 
          disabled={isLoading} 
        />
      </View>
      
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Resultado:</Text>
        <Text style={styles.resultText}>{result}</Text>
      </View>
      
      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
        <ScrollView style={styles.logs}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logLine}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  logs: {
    flex: 1,
  },
  logLine: {
    color: '#00ff00',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginBottom: 3,
  },
});