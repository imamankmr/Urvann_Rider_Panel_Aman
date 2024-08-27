import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './screens/MainTabNavigator';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RiderCodesScreen from './screens/RiderCodesScreen';
import DeliveryTabNavigator from './screens/DeliveryTabNavigator';
import ReverseProductDetailsScreen from './screens/ReverseProductDetailsScreen';
import DeliveryProductDetailsScreen from './screens/DeliveryProductDetailsScreen';
import RTOProductDetailsScreen from './screens/RTOProductDetailsScreen';


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
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="DeliveryTabs" component={DeliveryTabNavigator} options={{ headerShown: false }}/>
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
        <Stack.Screen name="ReverseProductDetails" component={ReverseProductDetailsScreen} options={{ title: 'Product Details' }} />
        <Stack.Screen name="DeliveryProductDetailsScreen" component={DeliveryProductDetailsScreen} options={{ title: 'Delivery Products' }} />
        <Stack.Screen name="RTOProductDetailsScreen" component={RTOProductDetailsScreen} options={{ title: 'RTO Products' }} />
        <Stack.Screen name="SellerName" component={RiderCodesScreen} options={{ title: 'Seller Name' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
