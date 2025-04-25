// components/HeaderComponent.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ImageBackground
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
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({
  showBackButton = false,
  onBackPress
}) => {
  const navigation = useNavigation();

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
    }
  };

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
        
        <View style={styles.rightContainer}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#ffffff" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Elemento decorativo - línea ondulada */}
      <View style={styles.wavyLine} />
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
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
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
  avatarContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wavyLine: {
    height: 4,
    backgroundColor: '#CAF0F8',
    borderBottomWidth: 1,
    borderBottomColor: '#90E0EF',
  },
});

export default HeaderComponent;