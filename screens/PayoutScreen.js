import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SummaryScreen from './SummaryScreen';
import RefundScreen from './RefundScreen';
import PayableScreen from './PayableScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const PayoutTabs = ({ driverName }) => (
  <Tab.Navigator
    swipeEnabled={false} // Disable swiping between tabs
    screenOptions={{
      swipeEnabled: false, // Move swipeEnabled to screenOptions as well
    }}
  >
    <Tab.Screen name="Summary" component={SummaryScreen} initialParams={{ driverName }} />
    <Tab.Screen name="Refund" component={RefundScreen} initialParams={{ driverName }} />
    <Tab.Screen name="Payable" component={PayableScreen} initialParams={{ driverName }} />
  </Tab.Navigator>
);

const PayoutScreen = ({ route }) => {
  const { driverName } = route.params;

  return (
    <NavigationContainer independent={true}>
      <PayoutTabs driverName={driverName} />
    </NavigationContainer>
  );
};

export default PayoutScreen;
