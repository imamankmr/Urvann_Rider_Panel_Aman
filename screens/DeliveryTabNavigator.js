import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DeliveryScreen from './DeliveryScreen';
import RTOScreen from './RTOScreen';
import RiderCodesScreen from './RiderCodesScreen';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

const DeliveryTabNavigator = ({ route }) => {
  const { driverName } = route.params;

  return (
    <Tab.Navigator
      initialRouteName="Delivery"
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
        name="Pickup"
        options={{ tabBarLabel: 'Pickup' }}
        initialParams={{ driverName }}
      >
        {(props) => <RiderCodesScreen {...props} driverName={driverName} />}
      </Tab.Screen>
      <Tab.Screen
        name="Delivery"
        options={{ tabBarLabel: 'Delivery' }}
        initialParams={{ driverName }}
      >
        {(props) => <DeliveryScreen {...props} driverName={driverName} />}
      </Tab.Screen>
      <Tab.Screen
        name="RTO"
        options={{ tabBarLabel: 'RTO' }}
        initialParams={{ driverName }}
      >
        {(props) => <RTOScreen {...props} driverName={driverName} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default DeliveryTabNavigator;
