import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import axios from 'axios';
import { Linking } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';

const DeliveryScreen = ({ route }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInputs, setUserInputs] = useState({});
  const [statuses, setStatuses] = useState({});
  const driverName = route.params.driverName;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`http://192.168.137.1:5002/api/customers/${driverName}`);
        const fetchedCustomers = response.data.customers;

        // Initialize user inputs and statuses with default values
        const initialUserInputs = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id) {
            acc[customer._id] = '0';
          }
          return acc;
        }, {});

        const initialStatuses = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id) {
            acc[customer._id] = '';
          }
          return acc;
        }, {});

        setUserInputs(initialUserInputs);
        setStatuses(initialStatuses);
        setCustomers(fetchedCustomers);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [driverName]);

  if (loading) {
    return <ActivityIndicator size="large" color="#287238" />;
  }

  const openMap = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const makeCall = (phoneNumber) => {
    let cleanedNumber = phoneNumber;
    if (cleanedNumber.startsWith('91')) {
      cleanedNumber = cleanedNumber.slice(2);
    }
    const url = `tel:${cleanedNumber}`;
    Linking.openURL(url);
  };

  const handleInputChange = (id, text) => {
    const value = text.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    const maxValue = customers.find(c => c._id === id).items;
    if (value === '' || (parseInt(value, 10) <= maxValue && parseInt(value, 10) >= 0)) {
      setUserInputs(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleIncrement = (id) => {
    setUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10);
      const maxValue = customers.find(c => c._id === id).items;
      return {
        ...prev,
        [id]: Math.min(currentValue + 1, maxValue).toString()
      };
    });
  };

  const handleDecrement = (id) => {
    setUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10);
      return {
        ...prev,
        [id]: Math.max(currentValue - 1, 0).toString()
      };
    });
  };

  const handleStatusChange = (id, value) => {
    setStatuses(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const keyExtractor = (item) => item._id ? item._id.toString() : `key-${Math.random()}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#d4edda'; // Green
      case 'Delivery failed':
        return '#f8d7da'; // Red
      case 'Reattempt':
        return '#fff3cd'; // Yellow
      default:
        return '#fff'; // Default background color
    }
  };

  const statusOptions = [
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Delivery failed', value: 'Delivery failed' },
    { label: 'Reattempt', value: 'Reattempt' },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <View style={[styles.itemContainer, { backgroundColor: getStatusColor(statuses[item._id]) }]}>
            <View style={styles.infoContainer}>
              <Text style={styles.customerName}>Name: {item.name}</Text>
              <Text style={styles.orderCode}>Order Code: {item.order_code}</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Select Status', value: null }}
                  items={statusOptions}
                  onValueChange={(value) => handleStatusChange(item._id, value)}
                  style={pickerSelectStyles}
                  value={statuses[item._id]}
                />
              </View>
              {statuses[item._id] === 'Delivered' && (
                <View style={styles.textInputContainer}>
                  <Text style={styles.textLabel}>Item delivered:</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handleDecrement(item._id)}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={userInputs[item._id]}
                      onChangeText={(text) => handleInputChange(item._id, text)}
                    />
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handleIncrement(item._id)}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.counterValue}>/{customers.find(c => c._id === item._id)?.items || 0}</Text>
                </View>
              )}
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={() => openMap(item.address)} style={styles.iconButton}>
                <MaterialCommunityIcons name="map-marker-outline" size={30} color="#287238" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => makeCall(item.phone)} style={styles.iconButton}>
                <FontAwesome name="phone" size={30} color="#287238" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  orderCode: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  textLabel: {
    fontSize: 16,
    color: '#333',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  counterButton: {
    backgroundColor: '#287238',
    borderRadius: 5,
    width: 30, // Increase size for easier tapping
    height: 30, // Increase size for easier tapping
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 20, // Adjust font size for better visibility
  },
  counterValue: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 10,
  },
  textInput: {
    borderBottomWidth: 1,
    borderColor: '#287238',
    paddingHorizontal: 8,
    width: 40, // Increase width for easier input
    textAlign: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 30,
  },
  pickerContainer: {
    marginBottom: 16, // Add space between picker and other fields
  },
});

// Styles for the dropdown picker
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#287238',
    borderRadius: 10, // Rounded corners for a more modern look
    color: '#333',
    backgroundColor: '#f9f9f9', // White background for better contrast
    width: 200,
    marginTop: 7,
    elevation: 1, // Add slight shadow
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#287238',
    borderRadius: 10, // Rounded corners for a more modern look
    color: '#333',
    backgroundColor: '#f9f9f9', // White background for better contrast
    width: 200,
    marginTop: 7,
    elevation: 1, // Add slight shadow
  },
  placeholder: {
    color: '#aaa', // Light gray color for placeholder
    fontSize: 16,
  },
});

export default DeliveryScreen;