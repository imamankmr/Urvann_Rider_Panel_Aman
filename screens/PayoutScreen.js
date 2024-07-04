import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SummaryScreen from './SummaryScreen';
import RefundScreen from './RefundScreen';
import PayableScreen from './PayableScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const PayoutTabs = ({ sellerName }) => (
  <Tab.Navigator
    swipeEnabled={false} // Disable swiping between tabs
    screenOptions={{
      swipeEnabled: false, // Move swipeEnabled to screenOptions as well
    }}
  >
    <Tab.Screen name="Summary" component={SummaryScreen} initialParams={{ sellerName }} />
    <Tab.Screen name="Refund" component={RefundScreen} initialParams={{ sellerName }} />
    <Tab.Screen name="Payable" component={PayableScreen} initialParams={{ sellerName }} />
  </Tab.Navigator>
);

const PayoutScreen = ({ route }) => {
  const { sellerName } = route.params;

  return (
    <NavigationContainer independent={true}>
      <PayoutTabs sellerName={sellerName} />
    </NavigationContainer>
  );
};

export default PayoutScreen;
