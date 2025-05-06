// components/HeaderComponent.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import GastroAvatar from './GastroAvatar';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderComponentProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  title?: string;
}

// Datos de ejemplo para notificaciones
const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Nuevo hábito recomendado',
    message: 'Te recomendamos registrar tu consumo de agua diario',
    time: '10 min',
    read: false
  },
  {
    id: '2',
    title: 'Recordatorio de registro',
    message: 'No olvides registrar tu progreso de hoy',
    time: '1 hora',
    read: false
  },
  {
    id: '3',
    title: 'Logro desbloqueado',
    message: '¡Felicidades! Has completado 7 días seguidos de registro',
    time: '2 días',
    read: true
  },
  {
    id: '4',
    title: 'Consejo digestivo',
    message: 'Recuerda mantener una postura correcta después de comer',
    time: '3 días',
    read: true
  }
];

const HeaderComponent: React.FC<HeaderComponentProps> = ({
  showBackButton = false,
  onBackPress,
  title
}) => {
  const navigation = useNavigation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Contar notificaciones no leídas
  const unreadCount = SAMPLE_NOTIFICATIONS.filter(n => !n.read).length;

  // Función para confirmar cierre de sesión
  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };
  
  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      console.log("Cerrando sesión...");
      await SecureStore.deleteItemAsync('authToken');
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
  
  // Renderizar una notificación individual
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
    >
      <View style={styles.notificationIcon}>
        <Ionicons 
          name="notifications" 
          size={18} 
          color={!item.read ? "#0077B6" : "#999"} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.headerContainer}>
      {/* Usamos un gradiente para el fondo */}
      <LinearGradient
        colors={['#0077B6', '#00B4D8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress || (() => navigation.goBack())}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <GastroAvatar size={40} />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextMain}>Gastro</Text>
              <Text style={styles.logoTextSub}>Assistant</Text>
            </View>
          </View>
        )}
        
        {title && (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
        
        <View style={styles.rightContainer}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={22} color="#ffffff" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                {unreadCount > 1 && (
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogoutPress}
          >
            <Ionicons name="log-out-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Elemento decorativo - línea ondulada */}
      <View style={styles.wavyLine} />
      
      {/* Modal de notificaciones */}
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
            
            <FlatList
              data={SAMPLE_NOTIFICATIONS}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.notificationsList}
              ListEmptyComponent={
                <Text style={styles.emptyNotificationsText}>
                  No tienes notificaciones
                </Text>
              }
            />
            
            <TouchableOpacity style={styles.markAllReadButton}>
              <Text style={styles.markAllReadText}>Marcar todo como leído</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 14,
    height: Platform.OS === 'ios' ? 65 : 70,
    paddingTop: Platform.OS === 'ios' ? 5 : StatusBar.currentHeight ? StatusBar.currentHeight - 10 : 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextContainer: {
    marginLeft: 8,
  },
  logoTextMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoTextSub: {
    fontSize: 14,
    color: '#E6F7FF',
    letterSpacing: 0.3,
    marginTop: -3,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  wavyLine: {
    height: 4,
    backgroundColor: '#CAF0F8',
    borderBottomWidth: 1,
    borderBottomColor: '#90E0EF',
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
    top: Platform.OS === 'ios' ? 80 : 70,
    right: 10,
    width: '90%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadNotification: {
    backgroundColor: 'rgba(0, 119, 182, 0.05)',
  },
  notificationIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyNotificationsText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
  },
  markAllReadButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  markAllReadText: {
    color: '#0077B6',
    fontWeight: '500',
  },
  // Modal de confirmación
  confirmDialog: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
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
    backgroundColor: '#FF6B6B',
  },
  logoutConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default HeaderComponent;