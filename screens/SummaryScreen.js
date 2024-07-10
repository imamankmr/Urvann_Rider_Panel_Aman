import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';

const SummaryScreen = ({ route }) => {
  const { driverName } = route.params;
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`https://baxw4atsl7.execute-api.ap-south-1.amazonaws.com/api/summary/${driverName}`);
        setSummary(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching summary:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchSummary();
  }, [driverName]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading summary...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.container}>
        <Text>Error loading summary data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary for {driverName}</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Name</Text>
          <Text style={styles.cell}>{summary.Name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Payable</Text>
          <Text style={styles.cell}>{summary.Payable}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Refunds</Text>
          <Text style={styles.cell}>{summary.Refunds}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Other Additions</Text>
          <Text style={styles.cell}>{summary['Other additions']}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>B2B Sales</Text>
          <Text style={styles.cell}>{summary['B2B sales']}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Stickers</Text>
          <Text style={styles.cell}>{summary.Stickers}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Penalty</Text>
          <Text style={styles.cell}>{summary.Penalty}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Total Paid</Text>
          <Text style={styles.cell}>{summary['Total Paid']}</Text>
        </View>
      </View>
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
  summaryContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerCell: {
    width: 160, // Set a fixed width for header cells
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  cell: {
    width: 150, // Set a fixed width for cells
    padding: 10,
    textAlign: 'center',
    borderColor: '#ccc',
  },
});

export default SummaryScreen;
