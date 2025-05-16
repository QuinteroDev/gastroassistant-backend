// screens/ProfileUpdateScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderComponent from '../components/HeaderComponent';
import api from '../utils/api';

export default function ProfileUpdateScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    has_endoscopy: false,
    endoscopy_result: 'NORMAL',
    has_ph_monitoring: false,
    ph_monitoring_result: 'NEGATIVE'
  });
  
  // Estados para mensajes de éxito y error (igual que en ChangePasswordScreen)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Función personalizada para volver al perfil
  const navigateToProfile = () => {
    console.log('Navegando a Profile desde ProfileUpdate...');
    
    // Intentar goBack primero (es la navegación más natural)
    const canGoBack = navigation.canGoBack();
    console.log('Can go back:', canGoBack);
    
    if (canGoBack) {
      try {
        navigation.goBack();
        return;
      } catch (error) {
        console.error('Error con goBack:', error);
      }
    }
    
    // Si goBack falla, navegar directamente
    try {
      navigation.navigate('Profile');
    } catch (error) {
      console.error('Error navegando a Profile:', error);
    }
  };
  
  // Cargar datos actuales del perfil
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/profiles/me/');
        
        if (response.data) {
          setFormData({
            weight_kg: response.data.weight_kg ? response.data.weight_kg.toString() : '',
            height_cm: response.data.height_cm ? response.data.height_cm.toString() : '',
            has_endoscopy: response.data.has_endoscopy || false,
            endoscopy_result: response.data.endoscopy_result || 'NORMAL',
            has_ph_monitoring: response.data.has_ph_monitoring || false,
            ph_monitoring_result: response.data.ph_monitoring_result || 'NEGATIVE'
          });
        }
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
        setErrorMessage("No se pudieron cargar tus datos. Por favor, intenta de nuevo.");
        
        // Ocultar mensaje de error después de 5 segundos
        setTimeout(() => {
          setErrorMessage(null);
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, []);
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    
    // Limpiar mensajes al empezar a escribir
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  // Manejar el cambio de los interruptores (switches)
  const handleSwitchChange = (field, value) => {
    if (field === 'has_endoscopy' && !value) {
      // Si se desactiva endoscopia, resetear el resultado
      setFormData(prevData => ({
        ...prevData,
        has_endoscopy: value,
        endoscopy_result: 'NORMAL'
      }));
    } else if (field === 'has_ph_monitoring' && !value) {
      // Si se desactiva la ph-metría, resetear el resultado
      setFormData(prevData => ({
        ...prevData,
        has_ph_monitoring: value,
        ph_monitoring_result: 'NEGATIVE'
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
    
    // Limpiar mensajes al cambiar switches
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  // Validar el formulario antes de enviar
  const validateForm = () => {
    const errors = [];
    
    if (formData.weight_kg && isNaN(Number(formData.weight_kg))) {
      errors.push("El peso debe ser un número válido");
    }
    
    if (formData.height_cm && isNaN(Number(formData.height_cm))) {
      errors.push("La altura debe ser un número válido");
    }
    
    if (formData.weight_kg && Number(formData.weight_kg) < 30) {
      errors.push("El peso debe ser mayor a 30 kg");
    }
    
    if (formData.weight_kg && Number(formData.weight_kg) > 250) {
      errors.push("El peso debe ser menor a 250 kg");
    }
    
    if (formData.height_cm && Number(formData.height_cm) < 100) {
      errors.push("La altura debe ser mayor a 100 cm");
    }
    
    if (formData.height_cm && Number(formData.height_cm) > 240) {
      errors.push("La altura debe ser menor a 240 cm");
    }
    
    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'));
      return false;
    }
    
    return true;
  };
  
  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    // Limpiar mensajes previos
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      setIsSaving(true);
      
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null
      };
      
      const response = await api.patch('/api/profiles/me/', dataToSend);
      
      if (response.status === 200) {
        setSuccessMessage("Tus datos clínicos han sido actualizados correctamente");
        
        // Ocultar mensaje de éxito después de 3 segundos y navegar de vuelta
        setTimeout(() => {
          setSuccessMessage(null);
          navigateToProfile();
        }, 3000);
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      const errorMsg = error.response?.data?.error || "No se pudo actualizar tu perfil. Por favor, intenta de nuevo.";
      setErrorMessage(errorMsg);
      
      // Ocultar mensaje de error después de 5 segundos
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderComponent 
          title="Actualizar Perfil" 
          showBackButton={true} 
          onBackPress={navigateToProfile} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077B6" />
          <Text style={styles.loadingText}>Cargando tus datos...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0077B6" barStyle="light-content" />
      <HeaderComponent 
        title="Actualizar Perfil" 
        showBackButton={true} 
        onBackPress={navigateToProfile} 
      />
      
      <ScrollView style={styles.contentContainer}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Medidas Corporales</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight_kg}
              onChangeText={(value) => handleInputChange('weight_kg', value)}
              placeholder="Ingresa tu peso en kg"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Altura (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.height_cm}
              onChangeText={(value) => handleInputChange('height_cm', value)}
              placeholder="Ingresa tu altura en cm"
              keyboardType="numeric"
            />
          </View>
          
          <Text style={styles.noteText}>
            * Tu IMC se calculará automáticamente con estos datos
          </Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Pruebas Médicas</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>¿Te has realizado una endoscopia?</Text>
            <Switch
              value={formData.has_endoscopy}
              onValueChange={(value) => handleSwitchChange('has_endoscopy', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.has_endoscopy ? '#0077B6' : '#f4f3f4'}
            />
          </View>
          
          {formData.has_endoscopy && (
            <View style={styles.radioContainer}>
              <Text style={styles.radioLabel}>Resultado:</Text>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.endoscopy_result === 'NORMAL' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('endoscopy_result', 'NORMAL')}
              >
                <View style={styles.radioButton}>
                  {formData.endoscopy_result === 'NORMAL' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Normal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.endoscopy_result === 'ESOPHAGITIS_A' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('endoscopy_result', 'ESOPHAGITIS_A')}
              >
                <View style={styles.radioButton}>
                  {formData.endoscopy_result === 'ESOPHAGITIS_A' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Esofagitis Grado A</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.endoscopy_result === 'ESOPHAGITIS_B' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('endoscopy_result', 'ESOPHAGITIS_B')}
              >
                <View style={styles.radioButton}>
                  {formData.endoscopy_result === 'ESOPHAGITIS_B' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Esofagitis Grado B</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.endoscopy_result === 'ESOPHAGITIS_C' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('endoscopy_result', 'ESOPHAGITIS_C')}
              >
                <View style={styles.radioButton}>
                  {formData.endoscopy_result === 'ESOPHAGITIS_C' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Esofagitis Grado C</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.endoscopy_result === 'ESOPHAGITIS_D' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('endoscopy_result', 'ESOPHAGITIS_D')}
              >
                <View style={styles.radioButton}>
                  {formData.endoscopy_result === 'ESOPHAGITIS_D' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Esofagitis Grado D</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>¿Te has realizado una pH-metría?</Text>
            <Switch
              value={formData.has_ph_monitoring}
              onValueChange={(value) => handleSwitchChange('has_ph_monitoring', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.has_ph_monitoring ? '#0077B6' : '#f4f3f4'}
            />
          </View>
          
          {formData.has_ph_monitoring && (
            <View style={styles.radioContainer}>
              <Text style={styles.radioLabel}>Resultado:</Text>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.ph_monitoring_result === 'NEGATIVE' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('ph_monitoring_result', 'NEGATIVE')}
              >
                <View style={styles.radioButton}>
                  {formData.ph_monitoring_result === 'NEGATIVE' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Negativo (Reflujo -)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.ph_monitoring_result === 'POSITIVE' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('ph_monitoring_result', 'POSITIVE')}
              >
                <View style={styles.radioButton}>
                  {formData.ph_monitoring_result === 'POSITIVE' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Positivo (Reflujo +)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.radioOption,
                  formData.ph_monitoring_result === 'UNKNOWN' && styles.radioSelected
                ]}
                onPress={() => handleInputChange('ph_monitoring_result', 'UNKNOWN')}
              >
                <View style={styles.radioButton}>
                  {formData.ph_monitoring_result === 'UNKNOWN' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioText}>Resultado Desconocido</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mensaje de éxito */}
        {successMessage && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Mensaje de error */}
        {errorMessage && (
          <View style={styles.errorMessage}>
            <Ionicons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.errorMessageText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0077B6',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005f73',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    paddingRight: 16,
  },
  radioContainer: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioSelected: {
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0077B6',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  buttonsContainer: {
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#0077B6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Estilos para mensajes (copiados del ChangePasswordScreen)
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  successText: {
    marginLeft: 8,
    color: '#155724',
    fontSize: 14,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorMessageText: {
    marginLeft: 8,
    color: '#721c24',
    fontSize: 14,
    lineHeight: 20,
  },
});