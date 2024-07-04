import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './screens/MainTabNavigator';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

const Stack = createStackNavigator();

const App = () => {
  const screenOptions = {
    headerStyle: {
      backgroundColor: '#287238',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
