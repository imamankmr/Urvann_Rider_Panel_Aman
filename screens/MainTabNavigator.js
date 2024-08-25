import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PayoutScreen from './PayoutScreen';
import DeliveryScreen from './DeliveryScreen';
import PickupTabNavigator from './PickupTabNavigator'; // Import the PickupTabNavigator
import ReturnsTabNavigator from './ReturnsTabNavigator'; // Import the new ReturnsTabNavigator
import { TouchableOpacity, Text } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

const MainTabNavigator = ({ navigation, route }) => {
  const driverName = route?.params?.driverName ?? 'defaultDriverName';

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Payout') {
            iconName = 'cash';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Pickup') {
            iconName = 'truck';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Returns') {
            iconName = 'package-variant';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          }else if (route.name === 'Delivery') {
            iconName = 'package';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#287238',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#f9f9f9',
          borderTopWidth: 1,
          borderTopColor: '#ccc',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: '#287238',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 10 }} onPress={handleLogout}>
            <Text style={{ color: 'white', fontSize: 19 }}>Logout</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Pickup" component={PickupTabNavigator} initialParams={{ driverName }} />
      <Tab.Screen name="Returns" component={ReturnsTabNavigator} initialParams={{ driverName }} />
      <Tab.Screen name="Delivery" component={DeliveryScreen} initialParams={{ driverName }} />
      <Tab.Screen name="Payout" component={PayoutScreen} initialParams={{ driverName }} />   
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
