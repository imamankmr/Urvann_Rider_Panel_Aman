import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import axios from 'axios';

const RefundScreen = ({ route }) => {
  const { driverName } = route.params;
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const response = await axios.get(`https://urvann-rider-panel.onrender.com/api/refund/${driverName}`);
        setRefunds(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching refunds:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [driverName]);

  const renderRefundItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.order_id}</Text>
      <Text style={styles.cell}>{item['SKU id']}</Text>
      <Text style={styles.cell}>{item.line_item_name}</Text>
      <Text style={styles.cell}>{item['Product amount']}</Text>
      <Text style={styles.cell}>{item.Qty}</Text>
      <Text style={styles.cell}>{item['Amount to be deducted']}</Text>
      <Text style={styles.cell}>{item['B2B price']}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading refunds...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading refund data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Refunds for {driverName}</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Order ID</Text>
            <Text style={styles.headerCell}>SKU ID</Text>
            <Text style={styles.headerCell}>Product Name</Text>
            <Text style={styles.headerCell}>Product Amount</Text>
            <Text style={styles.headerCell}>Quantity</Text>
            <Text style={styles.headerCell}>Amount to Deduct</Text>
            <Text style={styles.headerCell}>B2B Price</Text>
          </View>
          <FlatList
            data={refunds}
            renderItem={renderRefundItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </ScrollView>
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
    width: 100, // Set a fixed width for all header cells
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
    width: 100, // Set a fixed width for all cells
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
});

export default RefundScreen;
