import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PickupScreen from './PickupScreen';
import ReversePickupScreen from './ReversePickupScreen';

const Tab = createBottomTabNavigator();

const PickupTabNavigator = ({ route }) => {
  const { driverName } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f0f4f8',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          elevation: 5, // Adds shadow for Android
          shadowColor: '#000', // Shadow color for iOS
          shadowOffset: { width: 0, height: -2 }, // Shadow position for iOS
          shadowOpacity: 0.2, // Shadow opacity for iOS
          shadowRadius: 3, // Shadow radius for iOS
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '800',
          marginBottom: 10,
        },
        tabBarActiveTintColor: '#287238',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="PickupScreen" 
        component={PickupScreen} 
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ 
          title: 'Pickup',
          tabBarLabel: 'Pickup', // Set text label
        }} 
      />
      <Tab.Screen 
        name="ReversePickupScreen" 
        component={ReversePickupScreen} 
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ 
          title: 'Reverse Pickup',
          tabBarLabel: 'Reverse Pickup', // Set text label
        }} 
      />
    </Tab.Navigator>
  );
};

export default PickupTabNavigator;
