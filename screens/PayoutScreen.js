import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BACKEND_URL } from 'react-native-dotenv';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const PayoutScreen = ({ route }) => {
  const { driverName } = route.params;
  const [selectedTab, setSelectedTab] = useState('Today');
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [payoutData, setPayoutData] = useState({
    driverDetails: {
      driverAssigned: '',
      driverCode: '',
      hub: ''
    },
    totalEarnings: 0,
    ordersCompleted: 0,
    delivered: 0,
    notDelivered: 0,
    incentives: 0,
    penalties: 0,
    netEarnings: 0
  });

  const fetchPayoutData = async (startDate = null, endDate = null) => {
    try {
      let url = `${BACKEND_URL}/api/payout/${driverName}`;
      const params = new URLSearchParams();
      
      // If no dates provided, use today's date
      if (!startDate && !endDate) {
        const today = new Date();
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
      }
      
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Fetching payout data from:', url);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Payout response:', response.data);
      setPayoutData(response.data);
    } catch (error) {
      console.error('Detailed error in fetchPayoutData:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
      });
      
      // Set default data in case of error
      setPayoutData({
        driverDetails: {
          driverAssigned: driverName,
          driverCode: 'N/A',
          hub: 'N/A'
        },
        totalEarnings: 0,
        ordersCompleted: 0,
        delivered: 0,
        notDelivered: 0,
        incentives: 0,
        penalties: 0,
        netEarnings: 0
      });
    }
  };

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
    if (tab === 'Select Date') {
      setIsSelectingStartDate(true);
      setHasSelectedStartDate(false);
      setShowFromDatePicker(true);
    } else {
      const today = new Date();
      switch (tab) {
        case 'Today': {
          const startOfToday = new Date(today);
          startOfToday.setHours(0, 0, 0, 0);
          fetchPayoutData(startOfToday);
          break;
        }
        case 'This Week': {
          // Get start of week (Sunday) and end of week (Saturday)
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Set to Saturday
          endOfWeek.setHours(23, 59, 59, 999);

          console.log('Week range:', {
            start: startOfWeek.toISOString(),
            end: endOfWeek.toISOString()
          });

          fetchPayoutData(startOfWeek, endOfWeek);
          break;
        }
      }
    }
  };

  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
      setHasSelectedStartDate(true);
      // Short delay before showing the end date picker
      setTimeout(() => {
        setIsSelectingStartDate(false);
        setShowToDatePicker(true);
      }, 500);
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      setToDate(selectedDate);
      fetchPayoutData(fromDate, selectedDate);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, [driverName]);

  return (
    <View style={styles.container}>
      {/* Driver Details Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverInfoContainer}>
          <View style={styles.driverBasicInfo}>
            <Text style={styles.driverCode}>{payoutData.driverDetails.driverAssigned}</Text>
            <View style={styles.driverInfoRow}>
              <Text style={styles.riderCodeLabel}>Rider Code: </Text>
              <Text style={styles.riderCodeValue}>{payoutData.driverDetails.driverCode}</Text>
            </View>
            <View style={styles.hubContainer}>
              <Text style={styles.hubText}>{payoutData.driverDetails.hub}</Text>
            </View>
          </View>
          <View style={styles.totalEarningsContainer}>
            <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
            <View style={styles.totalEarningsCard}>
              <Text style={styles.totalEarningsAmount}>₹{payoutData.netEarnings}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Date Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Today' && styles.activeTab]}
          onPress={() => handleTabPress('Today')}
        >
          <Text numberOfLines={1} style={[styles.tabText, selectedTab === 'Today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'This Week' && styles.activeTab]}
          onPress={() => handleTabPress('This Week')}
        >
          <Text numberOfLines={1} style={[styles.tabText, selectedTab === 'This Week' && styles.activeTabText]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Select Date' && styles.activeTab]}
          onPress={() => handleTabPress('Select Date')}
        >
          <Text numberOfLines={1} style={[styles.tabText, selectedTab === 'Select Date' && styles.activeTabText]}>Select Date</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selection UI */}
      {selectedTab === 'Select Date' && (
        <View style={styles.dateSelectionContainer}>
          <View style={styles.datePickerRow}>
            <TouchableOpacity 
              style={[styles.datePickerButton, hasSelectedStartDate && styles.datePickerButtonSelected]}
              onPress={() => {
                setIsSelectingStartDate(true);
                setShowFromDatePicker(true);
              }}
            >
              <Text style={styles.datePickerLabel}>From Date</Text>
              <Text style={styles.selectedDate}>
                {hasSelectedStartDate ? fromDate.toLocaleDateString('en-IN') : 'Select Start Date'}
              </Text>
            </TouchableOpacity>
            <View style={styles.dateArrow}>
              <Text style={styles.dateArrowText}>→</Text>
            </View>
            <TouchableOpacity 
              style={[styles.datePickerButton, !hasSelectedStartDate && styles.datePickerButtonDisabled]}
              onPress={() => {
                if (hasSelectedStartDate) {
                  setIsSelectingStartDate(false);
                  setShowToDatePicker(true);
                }
              }}
            >
              <Text style={styles.datePickerLabel}>To Date</Text>
              <Text style={[styles.selectedDate, !hasSelectedStartDate && styles.datePickerTextDisabled]}>
                {hasSelectedStartDate ? toDate.toLocaleDateString('en-IN') : 'Select End Date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showFromDatePicker && (
        <>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerHeaderText}>Select Start Date</Text>
          </View>
          <DateTimePicker
            value={fromDate}
            mode="date"
            display="default"
            onChange={onFromDateChange}
            maximumDate={new Date()}
          />
        </>
      )}

      {showToDatePicker && (
        <>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerHeaderText}>Select End Date</Text>
          </View>
          <DateTimePicker
            value={toDate}
            mode="date"
            display="default"
            onChange={onToDateChange}
            minimumDate={fromDate}
            maximumDate={new Date()}
          />
        </>
      )}

      {/* Earnings and Orders Section */}
      <View style={styles.statsContainer}>
        <View style={styles.earningsCard}>
          <Text style={styles.cardTitle}>Today's Earnings</Text>
          <Text style={styles.earningsAmount}>₹{payoutData.totalEarnings}</Text>
        </View>
        <View style={styles.ordersCard}>
          <Text style={styles.cardTitle}>Orders Assigned</Text>
          <Text style={styles.ordersCount}>{payoutData.ordersCompleted}</Text>
        </View>
      </View>

      {/* Delivery Status Section */}
      <View style={styles.deliverySection}>
        <View style={styles.deliveryHeader}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
        </View>

        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, styles.deliveredCard]}>
            <Text numberOfLines={1} style={styles.statusLabel}>Delivered</Text>
            <Text style={styles.statusNumber}>{payoutData.delivered}</Text>
          </View>
          <View style={[styles.statusCard, styles.notDeliveredCard]}>
            <Text numberOfLines={1} style={styles.statusLabel}>Not Delivered</Text>
            <Text style={styles.statusNumber}>{payoutData.notDelivered}</Text>
          </View>
          <View style={[styles.statusCard, styles.incentivesCard]}>
            <Text numberOfLines={1} style={styles.statusLabel}>Incentive</Text>
            <Text style={styles.statusNumber}>₹{payoutData.incentives}</Text>
          </View>
          <View style={[styles.statusCard, styles.penaltiesCard]}>
            <Text numberOfLines={1} style={styles.statusLabel}>Penalties</Text>
            <Text style={styles.statusNumber}>₹{payoutData.penalties}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  driverBasicInfo: {
    flex: 1,
  },
  driverCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riderCodeLabel: {
    fontSize: 16,
    color: '#2196F3',
  },
  riderCodeValue: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  hubContainer: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hubText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  totalEarningsContainer: {
    width: 120,
    marginLeft: 16,
  },
  totalEarningsLabel: {
    fontSize: 17,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  totalEarningsCard: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalEarningsAmount: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
    height: 45,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
  },
  activeTabText: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    minHeight: 80,
  },
  ordersCard: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    minHeight: 80,
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
    width: '100%',
  },
  earningsAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  ordersCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  deliverySection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveredCard: {
    backgroundColor: '#4CAF50',
  },
  notDeliveredCard: {
    backgroundColor: '#FF5722',
  },
  incentivesCard: {
    backgroundColor: '#2196F3',
  },
  penaltiesCard: {
    backgroundColor: '#F44336',
  },
  statusLabel: {
    color: 'white',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  statusNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateSelectionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateArrow: {
    paddingHorizontal: 12,
  },
  dateArrowText: {
    fontSize: 20,
    color: '#666',
  },
  datePickerButtonSelected: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  datePickerButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  datePickerTextDisabled: {
    color: '#999',
  },
  datePickerHeader: {
    backgroundColor: '#4CAF50',
    padding: 12,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  datePickerHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PayoutScreen;
