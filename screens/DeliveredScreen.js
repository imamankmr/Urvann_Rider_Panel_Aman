import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL } from 'react-native-dotenv';

const DeliveredScreen = ({ route }) => {
  const [sellers, setSellers] = useState([]);
  const navigation = useNavigation();
  const { driverName } = route.params; // Extract driverName from route params

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/drivers/${driverName}/delivered`)
      .then(response => {
        setSellers(response.data);
      })
      .catch(error => console.error(`Error fetching reverse pickup sellers for ${driverName}:`, error));
  }, [driverName]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    axios.get(`${BACKEND_URL}/api/drivers/${driverName}/delivered`)
      .then(response => {
        setSellers(response.data);
      })
      .catch(error => console.error(`Error fetching reverse pickup sellers for ${driverName}:`, error));
    setRefreshing(false);
  };

  const handleSellerPress = (sellerName) => {
    // Define the endpoint for the PickupDetails screen
    const endpoint = '/api/reverse-delivered-products';  // Adjust this endpoint as needed
  
    navigation.navigate('ReverseProductDetails', {
      driverName,
      sellerName,
      endpoint  // Pass the endpoint parameter
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sellers}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.tile} 
            onPress={() => handleSellerPress(item.sellerName)}
          >
            <Text style={styles.sellerName}>
              {item.sellerName}
            </Text>
            <Text style={styles.productCount}>
              {item.productCount} {item.productCount === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // For Android shadow
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default DeliveredScreen;
