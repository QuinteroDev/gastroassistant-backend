// components/TabNavigationBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const TabNavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[
          styles.tabItem, 
          route.name === 'Home' && styles.activeTab
        ]}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons 
          name={route.name === 'Home' ? "home" : "home-outline"} 
          size={24} 
          color={route.name === 'Home' ? "#0077B6" : "#666666"} 
        />
        <Text style={route.name === 'Home' ? styles.tabLabel : styles.tabLabelInactive}>
          Inicio
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          route.name === 'Tracker' && styles.activeTab
        ]}
        onPress={() => navigation.navigate('Tracker')}
      >
        <Ionicons 
          name={route.name === 'Tracker' ? "calendar" : "calendar-outline"} 
          size={24} 
          color={route.name === 'Tracker' ? "#0077B6" : "#666666"} 
        />
        <Text style={route.name === 'Tracker' ? styles.tabLabel : styles.tabLabelInactive}>
          Tracker
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          styles.educationTab,
        ]}
        onPress={() => navigation.navigate('Education')}
      >
        <View style={[
          styles.educationIconContainer,
          route.name === 'Education' && styles.educationIconActive
        ]}>
          <MaterialIcons 
            name="psychology" 
            size={26} 
            color={route.name === 'Education' ? "#ffffff" : "#0077B6"} 
          />
        </View>
        <Text style={route.name === 'Education' ? styles.tabLabel : styles.tabLabelInactive}>
          Aprende
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          route.name === 'Stats' && styles.activeTab
        ]}
        onPress={() => navigation.navigate('Stats')}
      >
        <Ionicons 
          name={route.name === 'Stats' ? "analytics" : "analytics-outline"} 
          size={24} 
          color={route.name === 'Stats' ? "#0077B6" : "#666666"} 
        />
        <Text style={route.name === 'Stats' ? styles.tabLabel : styles.tabLabelInactive}>
          Estadísticas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabItem,
          route.name === 'Profile' && styles.activeTab
        ]}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons 
          name={route.name === 'Profile' ? "person" : "person-outline"} 
          size={24} 
          color={route.name === 'Profile' ? "#0077B6" : "#666666"} 
        />
        <Text style={route.name === 'Profile' ? styles.tabLabel : styles.tabLabelInactive}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  educationTab: {
    marginTop: -25,
  },
  educationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#0077B6',
  },
  educationIconActive: {
    backgroundColor: '#0077B6',
    borderColor: 'white',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0077B6',
    paddingBottom: 3,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#0077B6',
    fontWeight: 'bold',
  },
  tabLabelInactive: {
    fontSize: 12,
    marginTop: 4,
    color: '#666666',
  },
});

export default TabNavigationBar;