import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DeliveryScreen from './DeliveryScreen';
import RTOScreen from './RTOScreen';
import PickupTabNavigator from './PickupTabNavigator';

const Tab = createMaterialTopTabNavigator();

const DeliveryTabNavigator = ({ route }) => {
  const { driverName } = route.params; // Use default empty object if route.params is undefined

  return (
    <Tab.Navigator
      initialRouteName="PickupTabs"
      screenOptions={{
        tabBarActiveTintColor: '#287238',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#f8f8f8',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          elevation: 0, // Remove shadow on Android
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#287238',
          height: 3,
          borderRadius: 2,
        },
      }}
    >
      <Tab.Screen
        name="PickupTabs"
        component={PickupTabNavigator}
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ tabBarLabel: 'Pickup' }}
      />
      <Tab.Screen
        name="Delivery"
        component={DeliveryScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ tabBarLabel: 'Delivery' }}
      />
      <Tab.Screen
        name="RTO"
        component={RTOScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ tabBarLabel: 'RTO' }}
      />
    </Tab.Navigator>
  );
};

export default DeliveryTabNavigator;
