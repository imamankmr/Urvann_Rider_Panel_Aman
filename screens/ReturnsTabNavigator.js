import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DeliveredScreen from './DeliveredScreen'; // Import your Delivered screen
import NotDeliveredScreen from './NotDeliveredScreen'; // Import your Not Delivered screen

const TopTab = createMaterialTopTabNavigator();

const ReturnsTabNavigator = ({ route }) => {
  const { driverName } = route.params; // Extract driverName from the route params

  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#287238',
        tabBarInactiveTintColor: 'gray',
        tabBarIndicatorStyle: { backgroundColor: '#287238' }, // Indicator color
        tabBarLabelStyle: { fontSize: 14 }, // Label size
        tabBarStyle: { backgroundColor: '#f9f9f9' }, // Background color
      }}
    >
      <TopTab.Screen 
        name="Delivered"
        component={DeliveredScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
      />
      <TopTab.Screen 
        name="Not Delivered"
        component={NotDeliveredScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
      />
    </TopTab.Navigator>
  );
};

export default ReturnsTabNavigator;
