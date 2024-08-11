import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RTOScreen from './RTOScreen';
import RTOProductDetailsScreen from './RTOProductDetailsScreen';

const Stack = createStackNavigator();

const RTOStackNavigator = ({ route }) => {
  const { driverName } = route.params;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#287238',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="RTOScreen"
        component={RTOScreen}
        initialParams={{ driverName }} // Pass driverName as initialParams
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RTOProductDetailsScreen"
        component={RTOProductDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RTOStackNavigator;
