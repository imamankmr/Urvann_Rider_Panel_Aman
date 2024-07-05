import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PayoutScreen from './PayoutScreen';
import DeliveryUpdatesScreen from './DeliveryUpdatesScreen';
import RiderCodesScreen from './RiderCodesScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = ({ route }) => {
  const driverName = route?.params?.driverName ?? 'defaultDriverName';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Payout') {
            iconName = 'cash';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Pickup') {
            iconName = 'truck-delivery';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Delivery Updates') {
            iconName = 'clipboard-list';
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
          backgroundColor: '#287238', // Set header background color to green
        },
        headerTintColor: '#fff', // Set header text color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Payout" component={PayoutScreen} initialParams={{ driverName }} />
      <Tab.Screen name="Pickup" component={RiderCodesScreen} initialParams={{ driverName }} />
      <Tab.Screen name="Delivery Updates" component={DeliveryUpdatesScreen} initialParams={{ driverName }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
