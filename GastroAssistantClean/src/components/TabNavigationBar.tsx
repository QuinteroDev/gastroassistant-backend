import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../constants/theme';

const TabNavigationBar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // Mapeo de nombres de rutas
  const getTabName = (routeName: string) => {
    // ProgramDetails es nuestra pantalla "Home"
    if (routeName === 'ProgramDetails') return 'Home';
    return routeName;
  };
  
  const currentTab = getTabName(route.name);
  
  const navigateToTab = (tabName: string) => {
    if (tabName === 'Home') {
      navigation.navigate('ProgramDetails');
    } else if (tabName === 'Tracker') {
      navigation.navigate('Tracker');
    } else if (tabName === 'Education') {
      navigation.navigate('Education');
    } else if (tabName === 'Stats') {
      navigation.navigate('Stats');
    } else if (tabName === 'Profile') {
      navigation.navigate('Profile');
    } else {
      // Por ahora mostrar un console.log para las pantallas no implementadas
      console.log(`Navegando a ${tabName} - Pantalla aún no implementada`);
    }
  };
  
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[
          styles.tabItem, 
          currentTab === 'Home' && styles.activeTab
        ]}
        onPress={() => navigateToTab('Home')}
      >
        <Icon 
          name={currentTab === 'Home' ? "home" : "home-outline"} 
          size={24} 
          color={currentTab === 'Home' ? theme.colors.tabBar.active : theme.colors.tabBar.inactive} 
        />
        <Text style={[
          styles.tabLabel,
          currentTab === 'Home' ? styles.tabLabelActive : styles.tabLabelInactive
        ]}>
          Inicio
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          currentTab === 'Tracker' && styles.activeTab
        ]}
        onPress={() => navigateToTab('Tracker')}
      >
        <Icon 
          name={currentTab === 'Tracker' ? "calendar" : "calendar-outline"} 
          size={24} 
          color={currentTab === 'Tracker' ? theme.colors.tabBar.active : theme.colors.tabBar.inactive} 
        />
        <Text style={[
          styles.tabLabel,
          currentTab === 'Tracker' ? styles.tabLabelActive : styles.tabLabelInactive
        ]}>
          Tracker
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          styles.educationTab,
        ]}
        onPress={() => navigateToTab('Education')}
      >
        <View style={[
          styles.educationIconContainer,
          currentTab === 'Education' && styles.educationIconActive
        ]}>
          <MaterialIcons 
            name="psychology" 
            size={26} 
            color={currentTab === 'Education' ? '#ffffff' : theme.colors.primary} 
          />
        </View>
        <Text style={[
          styles.tabLabel,
          currentTab === 'Education' ? styles.tabLabelActive : styles.tabLabelInactive
        ]}>
          Aprende
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          currentTab === 'Stats' && styles.activeTab
        ]}
        onPress={() => navigateToTab('Stats')}
      >
        <Icon 
          name={currentTab === 'Stats' ? "trophy" : "trophy-outline"} 
          size={24} 
          color={currentTab === 'Stats' ? theme.colors.tabBar.active : theme.colors.tabBar.inactive} 
        />
        <Text style={[
          styles.tabLabel,
          currentTab === 'Stats' ? styles.tabLabelActive : styles.tabLabelInactive
        ]}>
          Logros
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          currentTab === 'Profile' && styles.activeTab
        ]}
        onPress={() => navigateToTab('Profile')}
      >
        <Icon 
          name={currentTab === 'Profile' ? "person" : "person-outline"} 
          size={24} 
          color={currentTab === 'Profile' ? theme.colors.tabBar.active : theme.colors.tabBar.inactive} 
        />
        <Text style={[
          styles.tabLabel,
          currentTab === 'Profile' ? styles.tabLabelActive : styles.tabLabelInactive
        ]}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Cambiar de 'space-around' a 'space-between'
    alignItems: 'center',
    backgroundColor: theme.colors.tabBar.background,
    paddingVertical: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 25 : theme.spacing.md,
    paddingHorizontal: 10, // Añadir padding horizontal
    borderTopWidth: 1,
    borderTopColor: theme.colors.tabBar.border,
    ...theme.shadows.md,
  },
  tabItem: {
    flex: 1, // Añadir flex: 1 para distribución uniforme
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    // Remover paddingHorizontal o reducirlo
    paddingHorizontal: 5, // Reducido de theme.spacing.md
  },
  educationTab: {
    marginTop: -25,
  },
  educationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  educationIconActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.accent,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
    paddingBottom: 3,
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  tabLabelActive: {
    color: theme.colors.tabBar.active,
    fontWeight: 'bold',
  },
  tabLabelInactive: {
    color: theme.colors.tabBar.inactive,
    fontWeight: 'normal',
  },
});

export default TabNavigationBar;