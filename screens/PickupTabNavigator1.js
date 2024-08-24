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
          backgroundColor: '#f9f9f9',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          elevation: 5, // Adds shadow for Android
          height: 60, // Increase the height to provide more space
        },
        tabBarLabelStyle: {
          fontSize: 14, // Reduce the font size slightly for better rendering on Android
          fontWeight: '500', // Adjusted to medium weight
          marginBottom: 8, // Adjust margin to ensure visibility
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
        }} 
      />
      <Tab.Screen 
        name="ReversePickupScreen" 
        component={ReversePickupScreen} 
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ 
          title: 'Returns',
        }} 
      />
    </Tab.Navigator>
  );
};

export default PickupTabNavigator;
