import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import axios from 'axios';
import { BACKEND_URL } from 'react-native-dotenv';
import RefreshButton from '../components/RefeshButton';

const PayableScreen = ({ route }) => {
  const { driverName } = route.params;
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayables = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/payable/${driverName}`);
      setPayables(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payables:', error);
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, [driverName]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayables();
    setRefreshing(false);
  };

  const renderPayableItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.order_id}</Text>
      <Text style={styles.cell}>{item.line_item_name}</Text>
      <Text style={styles.cell}>{item.line_item_price}</Text>
      <Text style={styles.cell}>{item.line_item_quantity}</Text>
      <Text style={styles.cell}>{item['Payable to vendor']}</Text>
      <Text style={styles.cell}>{item.SKU}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading payables...</Text>
      </View>
    );
  }

  if (error || !payables.length) {
    return (
      <View style={styles.container}>
        <Text>Error loading payable data.</Text>
        <RefreshButton onRefresh={handleRefresh} />  
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payables for {driverName}</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Order ID</Text>
            <Text style={styles.headerCell}>Line Item Name</Text>
            <Text style={styles.headerCell}>Line Item Price</Text>
            <Text style={styles.headerCell}>Line Item Quantity</Text>
            <Text style={styles.headerCell}>Payable to Vendor</Text>
            <Text style={styles.headerCell}>SKU</Text>
          </View>
          <FlatList
            data={payables}
            renderItem={renderPayableItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </ScrollView>
      <RefreshButton onRefresh={handleRefresh} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerCell: {
    width: 120, // Set a fixed width for all header cells
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  cell: {
    width: 120, // Set a fixed width for all cells
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
});

export default PayableScreen;
