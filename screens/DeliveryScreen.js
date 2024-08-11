import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Linking } from 'react-native';
import axios from 'axios';
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
        const response = await axios.get(`http:///10.5.16.226:5001/api/customers/${driverName}`);
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

  const updateDeliveryStatus = async (name, deliveryStatus) => {
    try {
      const response = await axios.put(`http:///10.5.16.226:5001/api/update-delivery-status/${name}`, {
        deliveryStatus
      });
      if (response.status === 200) {
        alert('Delivery status updated successfully');
      }
    } catch (error) {
      alert('Failed to update delivery status');
    }
  };

  const handleStatusChange = (id, value) => {
    const name = customers.find(c => c._id === id)?.name;
    if (name) {
      updateDeliveryStatus(name, value); // Call the API to update status
    }
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
      default:
        return '#fff'; // Default background color
    }
  };

  const statusOptions = [
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Delivery failed', value: 'Delivery failed' },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <View style={[styles.itemContainer, { backgroundColor: getStatusColor(statuses[item._id]) }]}>
            <View style={styles.infoContainer}>
              <Text style={[styles.orderCode, { color: 'green' }]}>{item.order_code}</Text>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
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
    backgroundColor: '#f9f9f9',
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
    fontWeight: 'bold', // Make orderCode bold
    marginBottom: 4,
  },
  address: {
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
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  counterButtonText: {
    fontSize: 20,
    color: '#333',
  },
  textInput: {
    width: 50,
    height: 30,
    textAlign: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  counterValue: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    marginTop: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#f9f9f9',
    borderRadius: 4,
    color: '#333',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor:'#D3D3D3',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
  },
  placeholder: {
    color: '#aaa',
  },
});

export default DeliveryScreen;
