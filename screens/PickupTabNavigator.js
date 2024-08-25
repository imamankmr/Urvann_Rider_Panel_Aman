import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import PickedScreen from './PickedScreen'; // Import your Picked screen
import NotPickedScreen from './NotPickedScreen'; // Import your Not Picked screen

const TopTab = createMaterialTopTabNavigator();

const PickupTabNavigator = ({ route }) => {
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
        name="Not Picked"
        component={NotPickedScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
      />
      <TopTab.Screen 
        name="Picked"
        component={PickedScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
      />
    </TopTab.Navigator>
  );
};

export default PickupTabNavigator;
