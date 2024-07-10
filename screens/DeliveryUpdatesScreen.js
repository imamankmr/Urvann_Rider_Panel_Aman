import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import axios from 'axios';

const DeliveryUpdatesScreen = ({ route }) => {
  const { driverName } = route.params;
  const [deliveryUpdates, setDeliveryUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeliveryUpdates = async () => {
      try {
        const response = await axios.get(`https://baxw4atsl7.execute-api.ap-south-1.amazonaws.com/api/data/${driverName}`);
        setDeliveryUpdates(response.data.deliveryUpdates);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching delivery updates:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchDeliveryUpdates();
  }, [driverName]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{new Date(item.Date).toLocaleDateString()}</Text>
      <Text style={styles.cell}>{item.Delivered}</Text>
      <Text style={styles.cell}>{item.Penalty}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error || deliveryUpdates.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Error loading delivery updates or no data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal>
      <View style={styles.container}>
        <Text style={styles.title}>Delivery Updates for {driverName}</Text>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Date</Text>
            <Text style={styles.headerCell}>Delivered</Text>
            <Text style={styles.headerCell}>Penalty</Text>
          </View>
          <FlatList
            data={deliveryUpdates}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </View>
    </ScrollView>
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
    width: 115, // Set a fixed width for all header cells
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
    width: 115, // Set a fixed width for all cells
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
});

export default DeliveryUpdatesScreen;
