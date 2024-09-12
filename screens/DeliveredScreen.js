import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL } from 'react-native-dotenv';

const ReversePickupScreen = ({ route }) => {
  const [sellers, setSellers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { driverName } = route.params;

  useEffect(() => {
    fetchSellers();
  }, [driverName]);

  const fetchSellers = () => {
    axios.get(`${BACKEND_URL}/api/drivers/${driverName}/delivered`)
      .then(response => {
        console.log('API Response:', response.data);  // Check the response
        setSellers(response.data);  // Update sellers state
      })
      .catch(error => console.error(`Error fetching reverse pickup sellers for ${driverName}:`, error));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSellers();
    setRefreshing(false);  // Stop refreshing after fetching data
  };

  const handleSellerPress = (sellerName) => {
    const endpoint = '/api/reverse-delivered-products';
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
        ListEmptyComponent={<Text style={styles.noSellersText}>No sellers found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productCount: {
    fontSize: 16,
    //fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  noSellersText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ReversePickupScreen;
