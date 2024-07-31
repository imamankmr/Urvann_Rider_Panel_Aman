import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import axios from 'axios';
import { Linking } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeliveryScreen = ({ route }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInputs, setUserInputs] = useState({});
  const [statuses, setStatuses] = useState({});
  const [isLocked, setIsLocked] = useState(true);
  const driverName = route.params.driverName;

  useEffect(() => {
    const checkSubmission = async () => {
      const submissionStatus = await AsyncStorage.getItem('riderCodesSubmitted');
      if (submissionStatus === 'true') {
        setIsLocked(false);
      } else {
        Alert.alert('Access Denied', 'Please complete the submission on the Rider Codes screen before accessing Delivery screen.');
      }
    };
    checkSubmission();
  }, []);

  useEffect(() => {
    if (!isLocked) {
      const fetchCustomers = async () => {
        try {
          const response = await axios.get(`https://urvann-rider-panel.onrender.com/api/customers/${driverName}`);
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
    }
  }, [driverName, isLocked]);

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
    { label: 'Reattempt', value: 'Reattempt' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.countText}>Pending: {customers.length}</Text>
        <Text style={styles.countText}>Delivered: {Object.values(statuses).filter(status => status === 'Delivered').length}</Text>
        <Text style={styles.countText}>Delivery failed: {Object.values(statuses).filter(status => status === 'Delivery failed').length}</Text>
        <Text style={styles.countText}>Reattempt: {Object.values(statuses).filter(status => status === 'Reattempt').length}</Text>
      </View>
      <FlatList
        data={customers}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <View style={[styles.customerContainer, { backgroundColor: getStatusColor(statuses[item._id]) }]}>
            <View style={styles.infoContainer}>
              <Text style={styles.customerName}>{item.shipping_address_full_name}</Text>
              <Text style={styles.customerDetails}>Order Code: {item.order_code}</Text>
              <Text style={styles.customerDetails}>Phone: {item.phone}</Text>
            </View>
            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={() => openMap(item.shipping_address_full_name)}>
                <MaterialCommunityIcons name="map-marker" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => makeCall(item.phone)}>
                <FontAwesome name="phone" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={() => handleDecrement(item._id)}>
                <Text style={styles.adjustButton}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={userInputs[item._id]}
                onChangeText={(text) => handleInputChange(item._id, text)}
              />
              <TouchableOpacity onPress={() => handleIncrement(item._id)}>
                <Text style={styles.adjustButton}>+</Text>
              </TouchableOpacity>
              <RNPickerSelect
                onValueChange={(value) => handleStatusChange(item._id, value)}
                items={statusOptions}
                value={statuses[item._id]}
                placeholder={{ label: 'Select Status', value: '' }}
                style={pickerSelectStyles}
              />
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
    backgroundColor: '#fff',
    padding: 20,
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerContainer: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  infoContainer: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerDetails: {
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    width: 80,
    marginHorizontal: 5,
    textAlign: 'center',
  },
  adjustButton: {
    fontSize: 24,
    paddingHorizontal: 10,
    color: '#287238',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    marginHorizontal: 5,
  },
  inputAndroid: {
    fontSize: 16,
    padding: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    marginHorizontal: 5,
  },
});

export default DeliveryScreen;
