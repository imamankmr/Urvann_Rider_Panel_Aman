import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';

const RiderCodesScreen = () => {
  const { params } = useRoute();
  const { driverName } = params;
  const [sellers, setSellers] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    axios.get(`https://urvann-rider-panel.onrender.com/api/driver/${driverName}/sellers`)
      .then(response => {
        console.log('Sellers response:', response.data);
        setSellers(response.data);
      })
      .catch(error => console.error(`Error fetching seller names for ${driverName}:`, error));
  }, [driverName]);

  const handleSellerPress = (sellerName) => {
    navigation.navigate('ProductDetails', { driverName, sellerName });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sellers for {driverName}:</Text>
      <FlatList
        data={sellers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSellerPress(item.sellerName)}>
            <View style={styles.tile}>
              <Text style={styles.text}>
                {item.sellerName}
              </Text>
              <Text style={styles.productCount}>
                {item.productCount} {item.productCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  productCount: {
    fontSize: 18,
    color: '#333',
    marginRight: 10,
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default RiderCodesScreen;
