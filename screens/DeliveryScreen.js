import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import axios from 'axios';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL } from 'react-native-dotenv';

const DeliveryScreen = ({ route }) => {
  const [deliveryCustomers, setDeliveryCustomers] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [deliveryUserInputs, setDeliveryUserInputs] = useState({});
  const [deliveryStatuses, setDeliveryStatuses] = useState({});
  const [deliveryLockedStatuses, setDeliveryLockedStatuses] = useState({}); // Add state to track locked statuses

  const [rtoCustomers, setRtoCustomers] = useState([]);
  const [rtoLoading, setRtoLoading] = useState(true);
  const [rtoUserInputs, setRtoUserInputs] = useState({});
  const [rtoStatuses, setRtoStatuses] = useState({});
  const [rtoLockedStatuses, setRtoLockedStatuses] = useState({}); // Add state to track locked statuses

  const driverName = route.params.driverName;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchDeliveryCustomers = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/customers/${driverName}`);
        const fetchedCustomers = response.data.customers;

        // Initialize user inputs, statuses, and locked statuses with fetched data
        const initialUserInputs = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id) {
            acc[customer._id] = '0';
          }
          return acc;
        }, {});

        const initialStatuses = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id) {
            acc[customer._id] = customer.metafield_delivery_status || ''; // Fetch the status
          }
          return acc;
        }, {});

        const initialLockedStatuses = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id && customer.metafield_delivery_status) {
            acc[customer._id] = true; // Lock statuses that are already set
          }
          return acc;
        }, {});

        setDeliveryUserInputs(initialUserInputs);
        setDeliveryStatuses(initialStatuses);
        setDeliveryLockedStatuses(initialLockedStatuses);

        // add type: 'delivery' to each customer object
        fetchedCustomers.forEach(customer => {
          customer.type = 'delivery';
        });

        setDeliveryCustomers(fetchedCustomers);
      } catch (error) {
        console.error('Error fetching delivery customers:', error);
      } finally {
        setDeliveryLoading(false);
      }
    };

    fetchDeliveryCustomers();
  }, [driverName]);

  useEffect(() => {
    const fetchRtoCustomers = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rtoscreen/${driverName}`);
        const fetchedCustomers = response.data.customers;
        const initialUserInputs = {};
        const initialStatuses = {};

        fetchedCustomers.forEach(customer => {
          if (customer._id) {
            initialUserInputs[customer._id] = '0';
            initialStatuses[customer._id] = customer.metafield_delivery_status || ''; // Set initial status
          }
        });

        const initialLockedStatuses = fetchedCustomers.reduce((acc, customer) => {
          if (customer._id && customer.metafield_delivery_status) {
            acc[customer._id] = true; // Lock statuses that are already set
          }
          return acc;
        }, {});


        setRtoUserInputs(initialUserInputs);
        setRtoStatuses(initialStatuses);
        setRtoLockedStatuses(initialLockedStatuses);

        // add type: 'rto' to each customer object
        fetchedCustomers.forEach(customer => {
          customer.type = 'rto';
        });
        setRtoCustomers(fetchedCustomers);
      } catch (error) {
        console.error('Failed to fetch RTO customers:', error);
      } finally {
        setRtoLoading(false);
      }
    };

    fetchRtoCustomers();
  }, [driverName]);

  const [customersCombinedData, setCustomersCombinedData] = useState([]);
  useEffect(() => {
    setCustomersCombinedData([...deliveryCustomers, ...rtoCustomers]);
  }, [deliveryCustomers, rtoCustomers]);

  if (deliveryLoading || rtoLoading) {
    return <ActivityIndicator size="large" color="#287238" />;
  }

  const openMap = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const makeCall = (phoneNumber) => {
    const cleanedNumber = phoneNumber.startsWith('91') ? phoneNumber.slice(2) : phoneNumber;
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const handleDeliveryInputChange = (id, text) => {
    const value = text.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    const maxValue = deliveryCustomers.find(c => c._id === id)?.items || 0;
    if (value === '' || (parseInt(value, 10) <= maxValue && parseInt(value, 10) >= 0)) {
      setDeliveryUserInputs(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleRtoInputChange = (id, text) => {
    const value = text.replace(/[^0-9]/g, '');
    const maxValue = rtoCustomers.find(c => c._id === id)?.items || 0;
    if (value === '' || (parseInt(value, 10) <= maxValue && parseInt(value, 10) >= 0)) {
      setRtoUserInputs(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleDeliveryIncrement = (id) => {
    setDeliveryUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10);
      const maxValue = deliveryCustomers.find(c => c._id === id)?.items || 0;
      return {
        ...prev,
        [id]: Math.min(currentValue + 1, maxValue).toString()
      };
    });
  };

  const handleRtoIncrement = (id) => {
    setRtoUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10) || 0;
      const maxValue = rtoCustomers.find(c => c._id === id)?.items || 0;
      return { ...prev, [id]: Math.min(currentValue + 1, maxValue).toString() };
    });
  };

  const handleDeliveryDecrement = (id) => {
    setDeliveryUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10);
      return {
        ...prev,
        [id]: Math.max(currentValue - 1, 0).toString()
      };
    });
  };

  const handleRtoDecrement = (id) => {
    setRtoUserInputs(prev => {
      const currentValue = parseInt(prev[id], 10) || 0;
      return { ...prev, [id]: Math.max(currentValue - 1, 0).toString() };
    });
  };

  const updateDeliveryStatus = async (name, deliveryStatus) => {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/update-delivery-status/${name}`, {
        deliveryStatus
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Delivery status updated successfully');
      } else if (response.status === 400) {
        Alert.alert('Error', 'Cannot change delivery status; status already set.');
      } else if (response.status === 401) {
        Alert.alert('Error', 'Cannot update delivery status while there are open locks');
      } else {
        console.error('Unexpected Response Status:', response.status);
        Alert.alert('Error', 'Failed to update delivery status: Unexpected response status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      if (error.response.status === 401) {
        Alert.alert('Error', 'Cannot update delivery status while there are open locks');
      } else {
        Alert.alert('Error', 'Failed to update delivery status: Network or Server Error');
      }
    }
  };

  const updateRtoStatus = async (name, deliveryStatus) => {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/update-rto-status/${name}`, {
        deliveryStatus
      });

      if (response.status === 200) {
        Alert.alert('Success', 'RTO status updated successfully');
      } else if (response.status === 400) {
        Alert.alert('Error', 'Cannot change RTO status; status already set.');
      } else if (response.status === 401) {
        Alert.alert('Error', 'Cannot update RTO status while there are open locks');
      } else {
        console.error('Unexpected Response Status:', response.status);
        Alert.alert('Error', 'Failed to update RTO status: Unexpected response status');
      }
    } catch (error) {
      console.error('Error updating RTO status:', error);
      if (error.response.status === 401) {
        Alert.alert('Error', 'Cannot update RTO status while there are open locks');
      } else {
        Alert.alert('Error', 'Failed to update RTO status: Network or Server Error');
      }
    }
  };

  const handleDeliveryStatusChange = (id, value) => {
    // If the selected value is null (or not set), directly update the status without confirmation
    if (value === null) {
      setDeliveryStatuses(prev => ({
        ...prev,
        [id]: value
      }));
      return;
    }

    if (deliveryLockedStatuses[id]) {
      Alert.alert('Status Locked', 'This status cannot be changed anymore.');
      return;
    }

    const name = deliveryCustomers.find(c => c._id === id)?.name;
    if (name) {
      updateDeliveryStatus(name, value).then((res) => {
        if (res.status === 401) {
          Alert.alert('Error', 'Cannot update delivery status while there are open locks');
          return;
        }
      });

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
              setDeliveryStatuses(prev => ({
                ...prev,
                [id]: value
              }));
              setDeliveryLockedStatuses(prev => ({
                ...prev,
                [id]: true // Lock the status after confirming
              }));
            },
          },
        ]
      );
    }
  };

  const handleRtoStatusChange = (id, value) => {
    // If the selected value is null (or not set), directly update the status without confirmation
    if (value === null) {
      setRtoStatuses(prev => ({
        ...prev,
        [id]: value
      }));
      return;
    }

    if (rtoLockedStatuses[id]) {
      Alert.alert('Status Locked', 'This status cannot be changed anymore.');
      return;
    }

    const name = rtoCustomers.find(c => c._id === id)?.name;
    if (name) {
      updateRtoStatus(name, value).then((res) => {
        if (res.status === 401) {
          Alert.alert('Error', 'Cannot update RTO status while there are open locks');
          return;
        }
      });

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
              await updateRtoStatus(name, value);
              setRtoStatuses(prev => ({
                ...prev,
                [id]: value
              }));
              setRtoLockedStatuses(prev => ({
                ...prev,
                [id]: true // Lock the status after confirming
              }));
            },
          },
        ]
      );
    }
  };

  const handleDragEnd = ({ data }) => {
    setCustomersCombinedData(data);
  };

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
      case 'Delivered':
        return '#d4edda'; // Green
      case 'Delivery failed':
        return '#f8d7da'; // Red
      default:
        return '#fff'; // Default background color
    }
  };

  const deliveryStatusOptions = [
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Delivery failed', value: 'Delivery failed' },
  ];

  const getRtoStatusOptions = (metafieldOrderStatus) => {
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

  const RTOnavigateToProductDetails = (orderCode, metafieldOrderType) => {
    navigation.navigate('RTOProductDetailsScreen', { order_code: orderCode, metafield_order_type: metafieldOrderType });
  };

  const keyExtractor = (item) => (item.type || `type-${Math.random()}`) + "-" + (item._id?.toString() || `key-${Math.random()}`);

  return (
    <View style={deliveryStyles.container}>
      <DraggableFlatList
        data={customersCombinedData}
        keyExtractor={keyExtractor}
        renderItem={({ item, drag, isActive }) => {
          if (item.type === 'delivery') {
            return (
              <View style={[deliveryStyles.itemContainer, { backgroundColor: getStatusColor(deliveryStatuses[item._id]) }]}>
                <View style={deliveryStyles.infoContainer}>
                  <Text style={[deliveryStyles.orderCode, { color: 'green' }]}>{item.order_code}</Text>
                  <Text style={deliveryStyles.customerName}>{item.name}</Text>
                  <Text style={deliveryStyles.address}>{item.address}</Text>
                  <View style={deliveryStyles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{ label: 'Select Status', value: null }}
                      items={deliveryStatusOptions}
                      onValueChange={(value) => handleDeliveryStatusChange(item._id, value)}
                      style={pickerSelectStyles}
                      value={deliveryStatuses[item._id]}
                      disabled={deliveryLockedStatuses[item._id]} // Disable picker if status is locked
                    />
                  </View>
                  {deliveryStatuses[item._id] === 'Delivered' && (
                    <View style={deliveryStyles.textInputContainer}>
                      <Text style={deliveryStyles.textLabel}>Item delivered:</Text>
                      <View style={deliveryStyles.counterContainer}>
                        <TouchableOpacity
                          style={deliveryStyles.counterButton}
                          onPress={() => handleDeliveryDecrement(item._id)}
                        >
                          <Text style={deliveryStyles.counterButtonText}>-</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={deliveryStyles.textInput}
                          keyboardType="numeric"
                          value={deliveryUserInputs[item._id]}
                          onChangeText={(text) => handleDeliveryInputChange(item._id, text)}
                        />
                        <TouchableOpacity
                          style={deliveryStyles.counterButton}
                          onPress={() => handleDeliveryIncrement(item._id)}
                        >
                          <Text style={deliveryStyles.counterButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={deliveryStyles.counterValue}>/{deliveryCustomers.find(c => c._id === item._id)?.items || 0}</Text>
                    </View>
                  )}
                </View>
                <View style={deliveryStyles.iconContainer}>
                  <TouchableOpacity onPress={() => openMap(item.address)} style={deliveryStyles.iconButton}>
                    <MaterialCommunityIcons name="map-marker-outline" size={30} color="#287238" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => makeCall(item.phone)} style={deliveryStyles.iconButton}>
                    <FontAwesome name="phone" size={30} color="#287238" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={deliveryStyles.dragHandle} onLongPress={drag}>
                  <MaterialCommunityIcons name="drag" size={24} color="#888" />
                </TouchableOpacity>
              </View>
            )
            // } else if (item.type === 'rto') {
          } else {
            return (
              <View style={[rtoStyles.itemContainer, { backgroundColor: getStatusColor(rtoStatuses[item._id]) }]}>
                <TouchableOpacity onLongPress={drag} delayLongPress={150} disabled={isActive}>
                  <View style={rtoStyles.infoContainer}>
                    <View style={rtoStyles.orderCodeContainer}>
                      <Text style={rtoStyles.orderCode}>{item.order_code}</Text>
                      <Text style={rtoStyles.metafieldOrderStatus}>{item.metafield_order_status}</Text>
                    </View>
                    <Text style={rtoStyles.customerName}>{item.name}</Text>
                    <Text style={rtoStyles.address}>{item.address}</Text>
                    <View style={rtoStyles.pickerContainer}>
                      <RNPickerSelect
                        placeholder={{ label: 'Select Status', value: null }}
                        items={getRtoStatusOptions(item.metafield_order_status)}
                        onValueChange={(value) => handleRtoStatusChange(item._id, value)}
                        style={pickerSelectStyles}
                        value={rtoStatuses[item._id]}
                        disabled={rtoLockedStatuses[item._id]} // Disable picker if status is locked
                      />
                    </View>
                    {rtoStatuses[item._id] === 'Delivered' && (
                      <View style={rtoStyles.textInputContainer}>
                        <Text style={rtoStyles.textLabel}>Items Delivered:</Text>
                        <View style={rtoStyles.counterContainer}>
                          <TouchableOpacity
                            style={rtoStyles.counterButton}
                            onPress={() => handleRtoDecrement(item._id)}
                          >
                            <Text style={rtoStyles.counterButtonText}>-</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={rtoStyles.textInput}
                            keyboardType="numeric"
                            value={rtoUserInputs[item._id]}
                            onChangeText={(text) => handleRtoInputChange(item._id, text)}
                          />
                          <TouchableOpacity
                            style={rtoStyles.counterButton}
                            onPress={() => handleRtoIncrement(item._id)}
                          >
                            <Text style={rtoStyles.counterButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={rtoStyles.counterValue}>
                          {`/${rtoCustomers.find(c => c._id === item._id)?.items || 0}`}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={rtoStyles.detailsButton}
                      onPress={() => RTOnavigateToProductDetails(item.order_code, item.metafield_order_status)}
                    >
                      <Text style={rtoStyles.detailsButtonText}>View Products</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                <View style={rtoStyles.iconContainer}>
                  <TouchableOpacity onPress={() => openMap(item.address)} style={rtoStyles.iconButton}>
                    <MaterialCommunityIcons name="map-marker-outline" size={30} color="#287238" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => makeCall(item.phone)} style={rtoStyles.iconButton}>
                    <FontAwesome name="phone" size={30} color="#287238" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
        }}
        onDragEnd={handleDragEnd}
      />
    </View>
  );
};

const commonItemContainer = {
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
  backgroundColor: '#fff', // Default background color, can be overridden
};

const deliveryStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  itemContainer: {
    ...commonItemContainer,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745', // Consistent green color for order code
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  iconButton: {
    marginHorizontal: 8,
    marginBottom: 10,
  },
});

const rtoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  itemContainer: {
    ...commonItemContainer,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  orderCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745', // Consistent green color for order code
    marginRight: 8,
  },
  metafieldOrderStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745', // Consistent green color for metafield status
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  iconButton: {
    marginHorizontal: 8,
    marginBottom: 10,
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    // backgroundColor: '#D3D3D3',
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
    backgroundColor: '#D3D3D3',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
  },
  placeholder: {
    color: '#aaa',
  },
});

export default DeliveryScreen;