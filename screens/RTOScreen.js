import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Button, Linking, Alert } from 'react-native';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Button, Linking, Alert } from 'react-native';
import axios from 'axios';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { BACKEND_URL } from 'react-native-dotenv';

const RTOScreen = ({ route }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInputs, setUserInputs] = useState({});
  const [statuses, setStatuses] = useState({});
  const driverName = route.params.driverName;
  const [lockedStatuses, setLockedStatuses] = useState({}); // Add state to track locked statuses
  const [lockedStatuses, setLockedStatuses] = useState({}); // Add state to track locked statuses
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rtoscreen/${driverName}`);
        const fetchedCustomers = response.data.customers;
        const initialUserInputs = {};
        const initialStatuses = {};

        fetchedCustomers.forEach(customer => {
          if (customer._id) {
            initialUserInputs[customer._id] = '0';
            initialStatuses[customer._id] = customer.metafield_delivery_status || ''; // Set initial status
            initialStatuses[customer._id] = customer.metafield_delivery_status || ''; // Set initial status
          }
        });

        const initialLockedStatuses = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id && customer.metafield_delivery_status) {
            acc[customer._id] = true; // Lock statuses that are already set
          }
          return acc;
        }, {});


        const initialLockedStatuses = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id && customer.metafield_delivery_status) {
            acc[customer._id] = true; // Lock statuses that are already set
          }
          return acc;
        }, {});


        setUserInputs(initialUserInputs);
        setStatuses(initialStatuses);
        setLockedStatuses(initialLockedStatuses);
        setLockedStatuses(initialLockedStatuses);
        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [driverName]);

  if (loading) {
    return <ActivityIndicator size="large" color="#287238" />;
  }

  const openMap = (address) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  const makeCall = (phoneNumber) => {
    const cleanedNumber = phoneNumber.startsWith('91') ? phoneNumber.slice(2) : phoneNumber;
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const handleInputChange = (id, text) => {
    const value = text.replace(/[^0-9]/g, '');
    const maxValue = customers.find(c => c._id === id)?.items || 0;
    if (value === '' || (parseInt(value, 10) <= maxValue && parseInt(value, 10) >= 0)) {
      setUserInputs(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleIncrement = (id) => {
    setUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10) || 0;
      const maxValue = customers.find(c => c._id === id)?.items || 0;
      return { ...prev, [id]: Math.min(currentValue + 1, maxValue).toString() };
    });
  };

  const handleDecrement = (id) => {
    setUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10) || 0;
      return { ...prev, [id]: Math.max(currentValue - 1, 0).toString() };
    });
  };

  const updateDeliveryStatus = async (name, deliveryStatus) => {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/update-rto-status/${name}`, {
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
    // If the selected value is null (or not set), directly update the status without confirmation
    if (value === null) {
      setStatuses(prev => ({
        ...prev,
        [id]: value
      }));
      return;
    }
  
    if (lockedStatuses[id]) {
      Alert.alert('Status Locked', 'This status cannot be changed anymore.');
      return;
    }
  
     const name = customers.find(c => c._id === id)?.name;
    if (name) {
      Alert.alert(
        'Confirm Status Change',
        `Are you sure you want to update the delivery status to "${value}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              await updateDeliveryStatus(name, value);
              setStatuses(prev => ({
                ...prev,
                [id]: value
              }));
              setLockedStatuses(prev => ({
                ...prev,
                [id]: true // Lock the status after confirming
              }));
            },
          },
        ]
      );
    }
      Alert.alert(
        'Confirm Status Change',
        `Are you sure you want to update the delivery status to "${value}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              await updateDeliveryStatus(name, value);
              setStatuses(prev => ({
                ...prev,
                [id]: value
              }));
              setLockedStatuses(prev => ({
                ...prev,
                [id]: true // Lock the status after confirming
              }));
            },
          },
        ]
      );
    }
  };

  const navigateToProductDetails = (orderCode, metafieldOrderType) => {
    navigation.navigate('RTOProductDetailsScreen', { order_code: orderCode, metafield_order_type: metafieldOrderType });
  };

  const keyExtractor = (item) => item._id?.toString() || `key-${Math.random()}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reverse Pickup Successful':
        return '#d4edda'; // Green
      case 'Reverse Pickup Failed':
        return '#f8d7da'; // Red
      case 'Replacement Pickup Successful':
        return '#d4edda'; // Green
      case 'Replacement Pickup Failed':
        return '#f8d7da'; // Red
      case 'Reverse Pickup Successful':
        return '#d4edda'; // Green
      case 'Reverse Pickup Failed':
        return '#f8d7da'; // Red
      case 'Replacement Pickup Successful':
        return '#d4edda'; // Green
      case 'Replacement Pickup Failed':
        return '#f8d7da'; // Red
      case 'Delivered':
        return '#d4edda'; // Green
      case 'Delivery failed':
        return '#f8d7da'; // Red
      default:
        return '#fff'; // Default background color
    }
  };

  const getStatusOptions = (metafieldOrderStatus) => {
    switch (metafieldOrderStatus) {
      case 'Reverse Pickup':
        return [
          { label: 'Reverse Pickup Successful', value: 'Reverse Pickup Successful' },
          { label: 'Reverse Pickup Failed', value: 'Reverse Pickup Failed' }
        ];
      case 'Replacement':
        return [
          { label: 'Replacement Pickup Successful', value: 'Replacement Pickup Successful' },
          { label: 'Replacement Pickup Failed', value: 'Replacement Pickup Failed' }
        ];
      default:
        return [
          { label: 'Delivered', value: 'Delivered' },
          { label: 'Delivery failed', value: 'Delivery failed' }
        ];
    }
  };

  const handleDragEnd = ({ data }) => {
    setCustomers(data);
  };

  const handleDragEnd = ({ data }) => {
    setCustomers(data);
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
      <DraggableFlatList
        data={customers}
        keyExtractor={keyExtractor}
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag, isActive }) => (
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag, isActive }) => (
          <View style={[styles.itemContainer, { backgroundColor: getStatusColor(statuses[item._id]) }]}>
            <TouchableOpacity onLongPress={drag}
      delayLongPress={150} disabled={isActive}>
              <View style={styles.infoContainer}>
                <View style={styles.orderCodeContainer}>
                  <Text style={styles.orderCode}>{item.order_code}</Text>
                  <Text style={styles.metafieldOrderStatus}>{item.metafield_order_status}</Text>
                </View>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    placeholder={{ label: 'Select Status', value: null }}
                    items={getStatusOptions(item.metafield_order_status)}
                    onValueChange={(value) => handleStatusChange(item._id, value)}
                    style={pickerSelectStyles}
                    value={statuses[item._id]}
                    disabled={lockedStatuses[item._id]} // Disable picker if status is locked
                  />
                </View>
                {statuses[item._id] === 'Delivered' && (
                  <View style={styles.textInputContainer}>
                    <Text style={styles.textLabel}>Items Delivered:</Text>
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
                    <Text style={styles.counterValue}>
                      {`/${customers.find(c => c._id === item._id)?.items || 0}`}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigateToProductDetails(item.order_code, item.metafield_order_status)}
                >
                  <Text style={styles.detailsButtonText}>View Products</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onLongPress={drag}
      delayLongPress={150} disabled={isActive}>
              <View style={styles.infoContainer}>
                <View style={styles.orderCodeContainer}>
                  <Text style={styles.orderCode}>{item.order_code}</Text>
                  <Text style={styles.metafieldOrderStatus}>{item.metafield_order_status}</Text>
                </View>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    placeholder={{ label: 'Select Status', value: null }}
                    items={getStatusOptions(item.metafield_order_status)}
                    onValueChange={(value) => handleStatusChange(item._id, value)}
                    style={pickerSelectStyles}
                    value={statuses[item._id]}
                    disabled={lockedStatuses[item._id]} // Disable picker if status is locked
                  />
                </View>
                {statuses[item._id] === 'Delivered' && (
                  <View style={styles.textInputContainer}>
                    <Text style={styles.textLabel}>Items Delivered:</Text>
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
                    <Text style={styles.counterValue}>
                      {`/${customers.find(c => c._id === item._id)?.items || 0}`}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigateToProductDetails(item.order_code, item.metafield_order_status)}
                >
                  <Text style={styles.detailsButtonText}>View Products</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  orderCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginRight: 8,
  },
  metafieldOrderStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
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
  detailsButton: {
    marginTop: 10,
    padding: 10,
    width: 240,
    backgroundColor: '#287238',
    borderRadius: 5,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
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

export default RTOScreen;