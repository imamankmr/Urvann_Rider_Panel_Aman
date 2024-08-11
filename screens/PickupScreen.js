import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const PickupScreen = ({ route }) => {
  const [sellers, setSellers] = useState([]);
  const navigation = useNavigation();
  const { driverName } = route.params; // Extract driverName from route params

  useEffect(() => {
    axios.get(`http:///10.5.16.226:5001/api/driver/${driverName}/pickup-sellers`)
      .then(response => {
        setSellers(response.data);
      })
      .catch(error => console.error(`Error fetching pickup sellers for ${driverName}:`, error));
  }, [driverName]);

  const handleSellerPress = (sellerName) => {
    // Define the endpoint for the PickupDetails screen
    const endpoint = '/api/pickup-products';  // Adjust this endpoint as needed
  
    navigation.navigate('ProductDetails', {
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

export default PickupScreen;
