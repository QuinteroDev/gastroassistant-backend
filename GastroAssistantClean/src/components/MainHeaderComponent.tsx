import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { removeData } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { theme } from '../constants/theme';

interface MainHeaderComponentProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function MainHeaderComponent({ showBackButton, onBackPress }: MainHeaderComponentProps) {
  const navigation = useNavigation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };
  
  const handleNotificationsPress = () => {
    Alert.alert(
      "Próximamente",
      "Las notificaciones estarán disponibles pronto. ¡Mantente atento a las actualizaciones!",
      [{ text: "OK", style: "default" }]
    );
  };
  
  const handleLogout = async () => {
    try {
      console.log("Cerrando sesión...");
      await removeData('authToken');
      await removeData('username');

      console.log("Token eliminado, redirigiendo a Login");
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        })
      );
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} translucent={false} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Área izquierda */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={onBackPress || (() => navigation.goBack())}
              >
                <Icon name="chevron-back" size={24} color={theme.colors.header.icon} />
              </TouchableOpacity>
            )}
            
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
          
          {/* Área derecha */}
          <View style={styles.rightSection}>
            <TouchableOpacity 
              style={styles.notificationButton} 
              onPress={handleNotificationsPress}
            >
              <Icon name="notifications-outline" size={22} color={theme.colors.header.icon} />
              {/* Indicador de notificaciones (para futuro uso) */}
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogoutPress}
            >
              <Icon name="log-out-outline" size={22} color={theme.colors.header.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
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
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.header.background,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  logoTextMain: {
    color: theme.colors.header.text,
  },
  logoTextAccent: {
    color: theme.colors.secondary,
  },
  notificationButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error.main,
    opacity: 0, // Oculto por ahora, se puede activar en el futuro
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialog: {
    width: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  logoutConfirmButton: {
    backgroundColor: theme.colors.button.primary.background,
  },
  logoutConfirmText: {
    color: theme.colors.button.primary.text,
    fontWeight: '500',
  },
});