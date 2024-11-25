import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Linking, Alert, RefreshControl, ActionSheetIOS, Platform } from 'react-native';
import axios from 'axios';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL } from 'react-native-dotenv';
import RefreshButton from '../components/RefeshButton';

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

      // Add type: 'delivery' to each customer object
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

  useEffect(() => {
    fetchDeliveryCustomers();
  }, [driverName]);

  const fetchRtoCustomers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rtoscreen/${driverName}`);
      const fetchedCustomers = response.data.customers;

      const initialUserInputs = {};
      const initialStatuses = {};
      const initialLockedStatuses = {};

      fetchedCustomers.forEach(customer => {
        if (customer._id) {
          initialUserInputs[customer._id] = '0';
          initialStatuses[customer._id] = customer.metafield_delivery_status || ''; // Correctly set initialStatuses
          if (customer.metafield_delivery_status) {
            initialLockedStatuses[customer._id] = true; // Mark as locked if status is present
          }
        }
        customer.orderType = customer.metafield_order_status || 'Default Order Type'; // Ensure orderType is set
      });

      setRtoUserInputs(initialUserInputs);
      setRtoStatuses(initialStatuses);
      setRtoLockedStatuses(initialLockedStatuses);
      setRtoCustomers(fetchedCustomers);

      //console.log('Fetched statuses:', initialStatuses); // Debugging log
    } catch (error) {
      console.error('Failed to fetch Rto customers:', error);
    } finally {
      setRtoLoading(false);
    }
  };

  useEffect(() => {
    fetchRtoCustomers();
  }, [driverName]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryCustomers();
    await fetchRtoCustomers();
    setRefreshing(false);
  };

  const [customersCombinedData, setCustomersCombinedData] = useState([]);
  useEffect(() => {
    setCustomersCombinedData([...deliveryCustomers, ...rtoCustomers]);
  }, [deliveryCustomers, rtoCustomers]);

  const [productsCounts, setProductsCounts] = useState({});

  const getProductsCount = async (orderCode, metafieldOrderType) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/deliveryscreen/product-details`, {
        params: {
          order_code: orderCode,
          metafield_order_type: metafieldOrderType,
        },
      });
      // console.log(response.data.length);

      let count = 0;
      for (const item of response.data) {
        count += item.total_item_quantity;
      }
      // console.log(count);

      return count;
    } catch (err) {
      setError('Error fetching product count');
      return 0;
    }
  }

  useEffect(() => {
    const fetchCounts = async () => {
      const counts = {};
      for (const item of customersCombinedData) {
        const count = await getProductsCount(item.order_code, item.metafield_order_status);
        counts[item.order_code] = count;
      }
      setProductsCounts(counts);
    };

    fetchCounts();
  }, [customersCombinedData]);


  if (deliveryLoading || rtoLoading) {
    return <ActivityIndicator size="large" color="#287238" />;
  }

  const openMap = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const makeCall = (phoneNumber, alternateNumber) => {
    // Clean numbers for dialing
    const cleanNumber = (number) => (number.startsWith('91') ? number.slice(2) : number);
  
    const options = [phoneNumber];
    const actions = [
      () => Linking.openURL(`tel:${cleanNumber(phoneNumber)}`),
    ];
  
    if (alternateNumber) {
      options.push(alternateNumber);
      actions.push(() => Linking.openURL(`tel:${cleanNumber(alternateNumber)}`));
    }
  
    options.push("Cancel");
    actions.push(() => {});
  
    if (Platform.OS === "ios") {
      // For iOS devices
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: "Call Customer",
        },
        (buttonIndex) => {
          if (actions[buttonIndex]) actions[buttonIndex]();
        }
      );
    } else {
      // For Android devices, use the default alert
      Alert.alert(
        "Call Customer",
        null,
        options.map((option, index) => ({
          text: option,
          onPress: actions[index],
          style: index === options.length - 1 ? "cancel" : "default",
        }))
      );
    }
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
        deliveryStatus,
        driverName,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Delivery status updated successfully');
        return { success: true };
      } else if (response.status === 400) {
        Alert.alert('Error', 'Cannot change delivery status; status already set.');
        return { success: false, status: 400 };
      } else if (response.status === 401) {
        Alert.alert('Error', 'Please submit pickup before proceeding');
        return { success: false, status: 401 };
      } else {
        console.error('Unexpected Response Status:', response.status);
        Alert.alert('Error', 'Failed to update delivery status: Unexpected response status');
        return { success: false };
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Please submit pickup before proceeding');
        return { success: false, status: 401 };
      } else {
        Alert.alert('Error', 'Failed to update delivery status: Network or Server Error');
        return { success: false };
      }
    }
  };

  const updateRtoStatus = async (name, orderType, deliveryStatus) => {
    try {
      //console.log("Updating Rto Status with", { name, orderType, deliveryStatus });

      const response = await axios.put(`${BACKEND_URL}/api/update-rto-status/${name}/${orderType}`, {
        deliveryStatus,
        driverName,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Rto status updated successfully');
        return { success: true };
      } else if (response.status === 400) {
        Alert.alert('Error', 'Cannot change Rto status; status already set.');
        return { success: false, status: 400 };
      } else if (response.status === 401) {
        Alert.alert('Error', 'Please submit pickup before proceeding');
        return { success: false, status: 401 };
      } else {
        console.error('Unexpected Response Status:', response.status);
        Alert.alert('Error', 'Failed to update Rto status: Unexpected response status');
        return { success: false };
      }
    } catch (error) {
      console.error('Error updating Rto status:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Please submit pickup before proceeding');
        return { success: false, status: 401 };
      } else {
        Alert.alert('Error', 'Failed to update Rto status: Network or Server Error');
        return { success: false };
      }
    }
  };


  const handleDeliveryStatusChange = (id, value) => {
    if (value === null) {
      // Do nothing if the value is null
      return;
    }

    if (deliveryLockedStatuses[id]) {
      Alert.alert('Status Locked', 'This status cannot be changed anymore.');
      return;
    }

    // Confirm the status change
    const name = deliveryCustomers.find(c => c._id === id)?.name;
    if (name) {
      Alert.alert(
        'Confirm Status Change',
        `Are you sure you want to update to "${value}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              const result = await updateDeliveryStatus(name, value);
              if (result.success) {
                // Update status and lock status
                setDeliveryStatuses(prev => ({
                  ...prev,
                  [id]: value
                }));
                setDeliveryLockedStatuses(prev => ({
                  ...prev,
                  [id]: true
                }));
              } else if (result.status === 401) {
                Alert.alert('Error', 'Please submit pickup before proceeding');
                // Reset the picker value to null (placeholder)
                setDeliveryStatuses(prev => ({
                  ...prev,
                  [id]: null
                }));
              }
            },
          },
        ]
      );
    }
  };

  const handleRtoStatusChange = (id, value) => {
    if (value === null) {
      // Do nothing if the value is null
      return;
    }

    if (rtoLockedStatuses[id]) {
      Alert.alert('Status Locked', 'This status cannot be changed anymore.');
      // Reset the picker value to null (placeholder)
      setRtoStatuses(prev => ({
        ...prev,
        [id]: null
      }));
      return;
    }

    const customer = rtoCustomers.find(c => c._id === id);
    const name = customer?.name;
    const orderType = customer?.orderType;

    if (!orderType) {
      console.error('Order type is missing for customer:', customer);
      Alert.alert('Error', 'Order type is missing. Cannot update status.');
      return;
    }

    if (name && orderType) {
      Alert.alert(
        'Confirm Status Change',
        `Are you sure you want to update to "${value}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              const result = await updateRtoStatus(name, orderType, value);
              if (result.success) {
                setRtoStatuses(prev => ({
                  ...prev,
                  [id]: value
                }));
                setRtoLockedStatuses(prev => ({
                  ...prev,
                  [id]: true
                }));
              } else if (result.status === 401) {
                Alert.alert('Error', 'Please submit pickup before proceeding');
                // Reset the picker value to null (placeholder)
                setRtoStatuses(prev => ({
                  ...prev,
                  [id]: null
                }));
              }
            },
          },
        ]
      );
    }
  };


  // const handleDragEnd = ({ data }) => {
  //   setCustomersCombinedData(data);
  // };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Z-Reverse Successful':
      case 'Z-Replacement Successful':
      case 'Z-Delivered':
        return '#d4edda'; // Green
      case 'Reverse Pickup Failed':
      case 'Replacement Pickup Failed':
      case 'A-Delivery Failed (CNR)':
      case 'A-Delivery failed (Rescheduled)':
      case 'Z-Delivery Failed (customer cancelled)':
      case 'A-Delivery Failed (rider side)':
      case 'A-Reverse failed (CNR)':
      case 'A-Reverse failed (Rescheduled)':
      case 'Z-Reverse failed (customer cancelled)':
      case 'A-Reverse failed (rider side)':
      case 'A-Replacement failed (CNR)':
      case 'A-Replacement failed (Rescheduled)':
      case 'Z-Replacement failed (customer cancelled)':
      case 'A-Replacement failed (rider side)':
        return '#f8d7da'; // Red
      default:
        //console.warn('Unknown status:', status);
        return '#fff'; // Default background color (white)
    }
  };


  const deliveryStatusOptions = [
    { label: 'Z-Delivered', value: 'Z-Delivered' },
    { label: 'A-Delivery Failed (CNR)', value: 'A-Delivery Failed (CNR)' },
    { label: 'A-Delivery failed (Rescheduled)', value: 'A-Delivery failed (Rescheduled)' },
    { label: 'Z-Delivery Failed (customer cancelled)', value: 'Z-Delivery Failed (customer cancelled)' },
    { label: 'A-Delivery Failed (rider side)', value: 'A-Delivery Failed (rider side)' },
  ];

  const getRtoStatusOptions = (metafieldOrderStatus) => {
    switch (metafieldOrderStatus) {
      case 'Reverse Pickup':
        return [
          { label: 'Z-Reverse Successful', value: 'Z-Reverse Successful' },
          { label: 'A-Reverse failed (CNR)', value: 'A-Reverse failed (CNR)' },
          { label: 'A-Reverse failed (Rescheduled)', value: 'A-Reverse failed (Rescheduled)' },
          { label: 'Z-Reverse failed (customer cancelled)', value: 'Z-Reverse failed (customer cancelled)' },
          { label: 'A-Reverse failed (rider side)', value: 'A-Reverse failed (rider side)' }
        ];
      case 'Replacement':
        return [
          { label: 'Z-Replacement Successful', value: 'Z-Replacement Successful' },
          { label: 'A-Replacement failed (CNR)', value: 'A-Replacement failed (CNR)' },
          { label: 'A-Replacement failed (Rescheduled)', value: 'A-Replacement failed (Rescheduled)' },
          { label: 'Z-Replacement failed (customer cancelled)', value: 'Z-Replacement failed (customer cancelled)' },
          { label: 'A-Replacement failed (rider side)', value: 'A-Replacement failed (rider side)' }
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

  const DeliveryNavigateToProductDetails = (orderCode, metafieldOrderType) => {
    navigation.navigate('DeliveryProductDetailsScreen', { order_code: orderCode, metafield_order_type: metafieldOrderType });
  };

  const keyExtractor = (item) => (item.type || `type-${Math.random()}`) + "-" + (item._id?.toString() || `key-${Math.random()}`);

  return (
    <View style={deliveryStyles.container}>
      <DraggableFlatList
        data={customersCombinedData}
        keyExtractor={keyExtractor}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item, isActive }) => {
          const statusColor = getStatusColor(deliveryStatuses[item._id]);
          // console.log(`Status for ${item.name}: ${deliveryStatuses[item._id]}, Color: ${statusColor}`);

          if (item.type === 'delivery') {
            return (
              <View style={[deliveryStyles.itemContainer, { backgroundColor: statusColor }]}>
                <View style={deliveryStyles.infoContainer}>
                  <Text style={[deliveryStyles.orderCode, { color: 'green' }]}>{item.order_code}</Text>
                  <Text style={deliveryStyles.customerName}>{item.name}</Text>
                  <Text style={deliveryStyles.address}>{item.address}</Text>
                  <View style={deliveryStyles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{ label: 'Select Status', value: null }} // Initial text
                      items={deliveryStatusOptions}
                      onValueChange={(value) => handleDeliveryStatusChange(item._id, value)}
                      style={pickerSelectStyles}
                      value={deliveryStatuses[item._id] || null} // Show placeholder if no status
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
                  <TouchableOpacity
                    style={deliveryStyles.detailsButton}
                    onPress={() => DeliveryNavigateToProductDetails(item.order_code, item.metafield_order_status)}
                  >
                    <Text style={deliveryStyles.detailsButtonText}>View Products</Text>
                  </TouchableOpacity>
                </View>
                <View style={deliveryStyles.iconContainer}>
                  <TouchableOpacity onPress={() => openMap(item.address)} style={deliveryStyles.iconButton}>
                    <MaterialCommunityIcons name="map-marker-outline" size={35} color="#287238" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => makeCall(item.phone, item.Alternate_number)} style={deliveryStyles.iconButton}>
                    <FontAwesome name="phone" size={35} color="#287238" />
                  </TouchableOpacity>
                </View>
                <View style={{ position: "absolute", right: 15, top: 15 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#287238'
                  }}>
                    Item{productsCounts[item.order_code] !== undefined && productsCounts[item.order_code] <= 1 ? "" : "s"} - {productsCounts[item.order_code] !== undefined ? productsCounts[item.order_code] : "..."}
                  </Text>
                </View>
                {/* <TouchableOpacity style={deliveryStyles.dragHandle} onLongPress={drag}>
                <MaterialCommunityIcons name="drag" size={24} color="#888" />
              </TouchableOpacity> */}
              </View>
            )
            // } else if (item.type === 'rto') {
          } else {
            return (
              <View style={[rtoStyles.itemContainer, { backgroundColor: getStatusColor(rtoStatuses[item._id]) }]}>
                <TouchableOpacity>
                  <View style={rtoStyles.infoContainer}>
                    <View style={rtoStyles.orderCodeContainer}>
                      <Text style={rtoStyles.orderCode}>{item.order_code}</Text>
                      <Text style={rtoStyles.metafieldOrderStatus}>{item.metafield_order_status}</Text>
                    </View>
                    <Text style={rtoStyles.customerName}>{item.name}</Text>
                    <Text style={rtoStyles.address}>{item.address}</Text>
                    <View style={rtoStyles.pickerContainer}>
                      <RNPickerSelect
                        placeholder={{ label: 'Select Status', value: null }} // Initial text
                        items={getRtoStatusOptions(item.metafield_order_status)}
                        onValueChange={(value) => handleRtoStatusChange(item._id, value)}
                        style={pickerSelectStyles}
                        value={rtoStatuses[item._id] || null} // Show placeholder if no status
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
                    <MaterialCommunityIcons name="map-marker-outline" size={35} color="#287238" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => makeCall(item.phone)} style={rtoStyles.iconButton}>
                    <FontAwesome name="phone" size={35} color="#287238" />
                  </TouchableOpacity>
                </View>
                <View style={{ position: "absolute", right: 15, top: 15 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#287238'
                  }}>
                    Item{productsCounts[item.order_code] !== undefined && productsCounts[item.order_code] <= 1 ? "" : "s"} - {productsCounts[item.order_code] !== undefined ? productsCounts[item.order_code] : "..."}
                  </Text>
                </View>
              </View>
            );
          }
        }}
      //onDragEnd={handleDragEnd}
      />
      <RefreshButton onRefresh={handleRefresh} />
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
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  itemContainer: {
    ...commonItemContainer,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 15,
    maxWidth: 282,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745', // Consistent green color for order code
    //marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    //marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    //marginBottom: 4,
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

const rtoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  itemContainer: {
    ...commonItemContainer,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 35,
    maxWidth: 282,
  },
  orderCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    //marginBottom: 4,
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
    //marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    //marginBottom: 4,
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
    // marginHorizontal: 2,
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
    paddingHorizontal: 12,
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