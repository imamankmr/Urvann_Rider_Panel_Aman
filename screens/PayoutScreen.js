import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SummaryScreen from './SummaryScreen';
import RefundScreen from './RefundScreen';
import PayableScreen from './PayableScreen';

const Tab = createMaterialTopTabNavigator();

const PayoutTabs = ({ driverName }) => (
  <Tab.Navigator
    screenOptions={{
      swipeEnabled: false, // Move swipeEnabled to screenOptions
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
