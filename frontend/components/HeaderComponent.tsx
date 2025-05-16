// components/HeaderComponent.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  FlatList,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { removeData } from '../utils/storage'; // Usar nuestra utilidad multiplataforma
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface HeaderComponentProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({
  showBackButton = false,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Función para confirmar cierre de sesión
  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };
  
  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      console.log("Cerrando sesión...");
      await removeData('authToken');
      await removeData('username');

      console.log("Token eliminado, redirigiendo a Login");
      
      // Usar CommonActions para que funcione en cualquier tipo de navegador
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Usamos un gradiente para el fondo con colores más modernos */}
      <LinearGradient
        colors={['#0077B6', '#00B4D8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Contenedor de header reorganizado */}
        <View style={styles.headerContent}>
          {/* Área izquierda con botón de regreso y logo */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={onBackPress || (() => navigation.goBack())}
              >
                <Ionicons name="chevron-back" size={22} color="#ffffff" />
              </TouchableOpacity>
            )}
            
            {/* Logo y texto desplazados a la izquierda */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>
                <Text style={styles.logoTextMain}>Gastro</Text>
                <Text style={styles.logoTextAccent}>Assistant</Text>
              </Text>
            </View>
          </View>
          
          {/* Área derecha - Notificaciones y cerrar sesión */}
          <View style={styles.rightSection}>
            {/* Botón de notificaciones sin badge */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            {/* Botón de cerrar sesión en azul */}
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogoutPress}
            >
              <Ionicons name="log-out-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Elemento decorativo - suave curva en la parte inferior */}
      <View style={styles.curveContainer}>
        <LinearGradient
          colors={['#00B4D8', '#CAF0F8']}
          style={styles.curve}
        />
      </View>
      
      {/* Modal de notificaciones - ahora con mensaje "en construcción" */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View 
            style={styles.notificationsContainer}
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}
          >
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.constructionContainer}>
              <Ionicons name="construct-outline" size={48} color="#0077B6" />
              <Text style={styles.constructionTitle}>Funcionalidad en construcción</Text>
              <Text style={styles.constructionMessage}>
                Las notificaciones estarán disponibles próximamente
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Modal de confirmación de cierre de sesión */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Cerrar sesión</Text>
            <Text style={styles.confirmMessage}>
              ¿Estás seguro de que quieres salir de la aplicación?
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, styles.logoutConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    zIndex: 10,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    height: Platform.OS === 'ios' ? 95 : (StatusBar.currentHeight || 0) + 60,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 15, // Espacio entre los iconos
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5, // Desplazamiento adicional a la izquierda
  },
  logo: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoTextMain: {
    color: '#ffffff',
  },
  logoTextAccent: {
    color: '#CAF0F8',
  },
  notificationButton: {
    position: 'relative',
  },
  logoutButton: {
    padding: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 5,
  },
  curveContainer: {
    height: 10,
    overflow: 'hidden',
  },
  curve: {
    height: 20,
    width: width,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  // Modal de notificaciones
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 10,
    width: '90%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    maxHeight: '80%',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  constructionContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  constructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  constructionMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal de confirmación de cierre de sesión
  confirmDialog: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    padding: 14,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  logoutConfirmButton: {
    backgroundColor: '#0077B6',
  },
  logoutConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default HeaderComponent;