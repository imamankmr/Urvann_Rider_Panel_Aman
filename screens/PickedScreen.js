import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL } from 'react-native-dotenv';

const PickedScreen = ({ route }) => {
  const [sellers, setSellers] = useState([]);
  const [isLocked, setIsLocked] = useState(false); // State to manage lock status
  const navigation = useNavigation();
  const { driverName } = route.params;

  useEffect(() => {
    // Fetch sellers and lock status from the server
    axios.get(`${BACKEND_URL}/api/drivers/${driverName}/picked`)
      .then(response => {
        const { sellers, lockStatus } = response.data;
        setSellers(sellers);
        
        // Update the lock status based on the response
        if (lockStatus === 'close') {
          setIsLocked(true); // Set locked state if lockStatus is 'close'
        } else {
          setIsLocked(false); // Set unlocked state otherwise
        }
        console.log('isLocked:', isLocked);
      })
      .catch(error => console.error(`Error fetching pickup sellers for ${driverName}:`, error));
  }, [driverName]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    axios.get(`${BACKEND_URL}/api/drivers/${driverName}/picked`)
      .then(response => {
        const { sellers, lockStatus } = response.data;
        setSellers(sellers);
        
        // Update the lock status based on the response
        if (lockStatus === 'close') {
          setIsLocked(true); // Set locked state if lockStatus is 'close'
        } else {
          setIsLocked(false); // Set unlocked state otherwise
        }
      })
      .catch(error => console.error(`Error fetching pickup sellers for ${driverName}:`, error));
    setRefreshing(false);
  };

  const handleSellerPress = (sellerName) => {
    // Allow navigation even if locked
    const endpoint = '/api/picked-products';  // Adjust this endpoint as needed
    navigation.navigate('ProductDetails', {
      driverName,
      sellerName,
      endpoint
    });
  };

  const handleLockPress = () => {
    axios.post(`${BACKEND_URL}/api/driver/${driverName}/lock-pickup`)
      .then(response => {
        setIsLocked(true); // Update the button text to "Completed"
        Alert.alert('Success', 'Pickup screen submitted successfully');
      })
      .catch(error => {
        console.error(`Error submitting pickup screen for ${driverName}:`, error);
        Alert.alert('Error', 'Failed to lock the pickup screen');
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
            // No need to disable list even when locked
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
      <TouchableOpacity 
        style={styles.lockButton} 
        onPress={handleLockPress}
        disabled={isLocked} // Disable button if already locked
      >
        <Text style={styles.lockButtonText}>
          {isLocked ? 'Completed' : 'Complete Pickup'}
        </Text>
      </TouchableOpacity>
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
  lockButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // For Android shadow
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PickedScreen;
