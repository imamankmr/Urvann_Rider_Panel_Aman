import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { BACKEND_URL } from "react-native-dotenv";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";

const PayoutScreen = ({ route }) => {
  const { driverName } = route.params;
  const [selectedTab, setSelectedTab] = useState("Today");
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [yesterdayDate, setYesterdayDate] = useState("");
  const [payoutData, setPayoutData] = useState({
    driverDetails: {
      driverAssigned: "",
      driverCode: "",
      hub: "",
    },
    totalEarnings: 0,
    ordersCompleted: 0,
    delivered: 0,
    notDelivered: 0,
    incentives: 0,
    penalties: 0,
    netEarnings: 0,
    orderDetails: [],
  });
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalView, setModalView] = useState("daily"); // 'daily', 'orders', 'delivered', 'notDelivered'
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [dateWiseEarnings, setDateWiseEarnings] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can adjust this number

  const getPaginatedData = (data) => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };

  console.log("toDate",toDate);
  console.log("fromDate",fromDate);

  const fetchPayoutData = async (startDate = null, endDate = null) => {
    try {
      let url = `${BACKEND_URL}/api/payout/${driverName}`;
      const params = new URLSearchParams();

      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Fetching payout data from:", url);
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      // Log complete response data
      console.log("Complete API Response:", JSON.stringify(response.data, null, 2));
      
      // Log order details with all fields
      console.log("Order Details (All Fields):", response.data.orderDetails.map(order => ({
        txnId: order.txnId,
        deliveryStatus: order.deliveryStatus,
        paymentDate: order.paymentDate,
        remarks: order.remarks,
        baseEarning: order.baseEarning,
        incentives: order.incentives,
        penalties: order.penalties
      })));

      setPayoutData(response.data);
    } catch (error) {
      console.error("Error fetching payout data:", error);
      // Set default data in case of error
      setPayoutData({
        driverDetails: {
          driverAssigned: driverName,
          driverCode: "N/A",
          hub: "N/A",
        },
        totalEarnings: 0,
        ordersCompleted: 0,
        delivered: 0,
        notDelivered: 0,
        incentives: 0,
        penalties: 0,
        netEarnings: 0,
        orderDetails: [],
      });
    }
  };

  const fetchDateWiseEarnings = async (startDate, endDate) => {
    try {
      let url = `${BACKEND_URL}/api/payout/date-wise/${driverName}`;
      const params = new URLSearchParams();

      params.append("startDate", startDate);
      params.append("endDate", endDate);

      url += `?${params.toString()}`;

      console.log("Fetching date-wise earnings from:", url);
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      // Log the response data to check remarks
      console.log("Date-wise earnings response:", JSON.stringify(response.data, null, 2));
      console.log("Sample date-wise orders:", response.data.dateWiseEarnings?.[0]?.orders?.slice(0, 3));

      setDateWiseEarnings(response.data.dateWiseEarnings);
    } catch (error) {
      console.error("Error fetching date-wise earnings:", error);
      setDateWiseEarnings([]);
    }
  };

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
    if (tab === "Select Date") {
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
  
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
  
      setIsSelectingStartDate(true);
      setHasSelectedStartDate(false);
      // setFromDate(today);
      // setToDate(today);
  
      // 🔥 Fetch today's data
      fetchPayoutData(startOfToday, endOfToday);
      fetchDateWiseEarnings(startOfToday, endOfToday);
     
    } else {
      const today = new Date();
      switch (tab) {
        case "Today": {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          const endOfYesterday = new Date(yesterday);
          endOfYesterday.setHours(23, 59, 59, 999);

          fetchPayoutData(yesterday, endOfYesterday);
          break;
        }
        case "This Week": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfToday = new Date(today);
          endOfToday.setHours(23, 59, 59, 999);

          // Log the date range being used
          console.log("This Week date range:", {
            start: startOfWeek.toISOString(),
            end: endOfToday.toISOString(),
          });

          fetchPayoutData(startOfWeek, endOfToday);
          fetchDateWiseEarnings(startOfWeek, endOfToday);
          break;
        }
      }
    }
  };


  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      // Format the date as MM/DD/YYYY
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      setFromDate(selectedDate);
      setHasSelectedStartDate(true);

      // Log the selected start date
      console.log("Selected start date:", formattedDate);

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
      // Format the date as MM/DD/YYYY
      const formattedToDate = selectedDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      const formattedFromDate = fromDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      setToDate(selectedDate);

      // Log the dates being sent to the API
      console.log("Sending date range to API:", {
        from: formattedFromDate,
        to: formattedToDate
      });

      // Fetch both overall payout data and date-wise earnings
      fetchPayoutData(formattedFromDate, formattedToDate);
      fetchDateWiseEarnings(formattedFromDate, formattedToDate);
    }
  };

  useEffect(() => {
    // Set default tab to Today and fetch yesterday's data
    setSelectedTab("Today");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    fetchPayoutData(yesterday, endOfYesterday);
  }, [driverName]);

  // Calculate yesterday's date when component mounts
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
    });
    setYesterdayDate(formattedDate);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [modalView, selectedTab, selectedDate]);

  const getDailyEarnings = () => {
    if (!payoutData.orderDetails || payoutData.orderDetails.length === 0)
      return [];

    // Group orders by date
    const ordersByDate = payoutData.orderDetails.reduce((acc, order) => {
      const date = new Date(order.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (!acc[date]) {
        acc[date] = {
          date,
          baseEarning: 0,
          incentives: 0,
          penalties: 0,
          orders: [],
        };
      }

      acc[date].baseEarning += order.baseEarning;
      acc[date].incentives += order.incentives;
      acc[date].penalties += order.penalties;
      acc[date].orders.push(order);

      return acc;
    }, {});

    // Get dates from start of week to today
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday

    const dates = [];
    let currentDate = new Date(startOfWeek);

    while (currentDate <= today) {
      const formattedDate = currentDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      dates.push({
        date: formattedDate,
        baseEarning: ordersByDate[formattedDate]?.baseEarning || 0,
        incentives: ordersByDate[formattedDate]?.incentives || 0,
        penalties: ordersByDate[formattedDate]?.penalties || 0,
        orders: ordersByDate[formattedDate]?.orders || [],
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates.reverse(); // Show most recent dates first
  };

  const handleEarningsCardPress = () => {
    setModalView("daily");
    setSelectedDate(null);
    setShowOrderDetailsModal(true);
  };

  console.log("modelview", modalView);
  const handleDatePress = (date) => {
    setSelectedDate(date);
    setModalView("orders");
    setShowOrderDetailsModal(true);
  };

  const handleBackPress = () => {
    setModalView("daily");
    setSelectedDate(null);
  };

  const handleStatusPress = (status) => {
    setSelectedStatus(status);
    setModalView(status === "Z-Delivered" ? "delivered" : "notDelivered");
    setShowOrderDetailsModal(true);
  };

  const handleIncentivesPress = () => {
    setSelectedStatus("incentives");
    setModalView("incentives");
    setShowOrderDetailsModal(true);
  };

  const handlePenaltiesPress = () => {
    setSelectedStatus("penalties");
    setModalView("penalties");
    setShowOrderDetailsModal(true);
  };

  // const itemsPerPage = 10; // or whatever you use
  const startIndex = (currentPage - 1) * itemsPerPage + 1;


  console.log("date wise earn",dateWiseEarnings);

  // Total Daily Items (used in date-wise earnings view)
  const totalDailyItems = dateWiseEarnings.length;
  const dailyStartIndex = startIndex;
  const dailyEndIndex = Math.min(currentPage * itemsPerPage, totalDailyItems);

  // Delivered Orders
  const totalDeliveredItems = payoutData.delivered;
  const deliveredStartIndex = startIndex;
  const deliveredEndIndex = Math.min(
    currentPage * itemsPerPage,
    totalDeliveredItems
  );

  // Not Delivered Orders
  const totalNotDeliveredItems = payoutData.notDelivered;
  const notDeliveredStartIndex = startIndex;
  const notDeliveredEndIndex = Math.min(
    currentPage * itemsPerPage,
    totalNotDeliveredItems
  );

  // Penalty Orders
  const totalPenaltyItems = payoutData.penalties;
  const penaltyStartIndex = startIndex;
  const penaltyEndIndex = Math.min(
    currentPage * itemsPerPage,
    totalPenaltyItems
  );

  // Incentive Orders
  const totalIncentiveItems = payoutData.orderDetails.length; // full list for incentives
  const incentiveStartIndex = startIndex;
  const incentiveEndIndex = Math.min(
    currentPage * itemsPerPage,
    totalIncentiveItems
  );


  console.log("payout", payoutData.orderDetails)

  // Add a useEffect to log the current payoutData when it changes
  useEffect(() => {
    console.log("Current payoutData:", JSON.stringify(payoutData, null, 2));
    console.log("Sample order details from state:", payoutData.orderDetails?.slice(0, 3));
  }, [payoutData]);

  // Add a useEffect to log the current dateWiseEarnings when it changes
  useEffect(() => {
    console.log("Current dateWiseEarnings:", JSON.stringify(dateWiseEarnings, null, 2));
    console.log("Sample date-wise orders from state:", dateWiseEarnings[0]?.orders?.slice(0, 3));
  }, [dateWiseEarnings]);

  return (
    <View style={styles.container}>
      {/* Driver Details Card */}
      <ScrollView style={styles.dateScrollView}>
      <View style={styles.driverCard}>
        <View style={styles.driverInfoContainer}>
          <View style={styles.driverBasicInfo}>
            <Text style={styles.driverCode}>
              {payoutData.driverDetails.driverAssigned}
            </Text>
            <View style={styles.driverInfoRow}>
              <Text style={styles.riderCodeLabel}>Rider Code: </Text>
              <Text style={styles.riderCodeValue}>
                {payoutData.driverDetails.driverCode}
              </Text>
            </View>
            <View style={styles.hubContainer}>
              <Text style={styles.hubText}>{payoutData.driverDetails.hub}</Text>
            </View>
          </View>
          <View style={styles.totalEarningsContainer}>
            <Text style={styles.totalEarningsLabel}>Balance</Text>
            <View style={styles.totalEarningsCard}>
              <Text style={styles.totalEarningsAmount}>
                ₹{payoutData.lifetimeEarnings}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Date Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "Today" && styles.activeTab]}
          onPress={() => handleTabPress("Today")}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              selectedTab === "Today" && styles.activeTabText,
            ]}
          >
            {yesterdayDate}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "This Week" && styles.activeTab]}
          onPress={() => handleTabPress("This Week")}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              selectedTab === "This Week" && styles.activeTabText,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Select Date" && styles.activeTab,
          ]}
          onPress={() => handleTabPress("Select Date")}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              selectedTab === "Select Date" && styles.activeTabText,
            ]}
          >
            Select Date
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Selection UI */}
      {selectedTab === "Select Date" && (
        <View style={styles.dateSelectionContainer}>
          <View style={styles.datePickerRow}>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                hasSelectedStartDate && styles.datePickerButtonSelected,
              ]}
              onPress={() => {
                true;
                setShowFromDatePicker(true);
              }}
            >
              <Text style={styles.datePickerLabel}>From Date</Text>
              <Text style={styles.selectedDate}>
                {hasSelectedStartDate
                  ? fromDate.toLocaleDateString("en-IN")
                  : "Select Start Date"}
              </Text>
            </TouchableOpacity>
            <View style={styles.dateArrow}>
              <Text style={styles.dateArrowText}>→</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                !hasSelectedStartDate && styles.datePickerButtonDisabled,
              ]}
              onPress={() => {
                if (hasSelectedStartDate) {
                  setIsSelectingStartDate(false);
                  setShowToDatePicker(true);
                }
              }}
            >
              <Text style={styles.datePickerLabel}>To Date</Text>
              <Text
                style={[
                  styles.selectedDate,
                  !hasSelectedStartDate && styles.datePickerTextDisabled,
                ]}
              >
                {hasSelectedStartDate
                  ? toDate.toLocaleDateString("en-IN")
                  : "Select End Date"}
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
        <TouchableOpacity
          style={styles.earningsCard}
          onPress={handleEarningsCardPress}
        >
          <Text style={styles.cardTitle}>
            {selectedTab === "Today"
              ? `${yesterdayDate}'s Earnings`
              : selectedTab === "This Week"
              ? "This Week's Earnings"
              : `${fromDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })} - ${toDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })} Earnings`}
          </Text>
          <Text style={styles.earningsAmount}>₹{payoutData.netEarnings}</Text>
        </TouchableOpacity>
        <View style={styles.ordersCard}>
          <Text style={styles.cardTitle}>Total Orders</Text>
          <Text style={styles.ordersCount}>{payoutData.ordersCompleted}</Text>
        </View>
      </View>

      {/* Delivery Status Section */}
      <View style={styles.deliverySection}>
        <View style={styles.deliveryHeader}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
        </View>

        <View style={styles.statusGrid}>
          <TouchableOpacity
            style={[styles.statusCard, styles.deliveredCard]}
            onPress={() => handleStatusPress("Z-Delivered")}
          >
            <Text numberOfLines={1} style={styles.statusLabel}>
              Delivered
            </Text>
            <Text style={styles.statusNumber}>{payoutData.delivered}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusCard, styles.notDeliveredCard]}
            onPress={() => handleStatusPress("Not Delivered")}
          >
            <Text numberOfLines={1} style={styles.statusLabel}>
              Not Delivered
            </Text>
            <Text style={styles.statusNumber}>{payoutData.notDelivered}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusCard, styles.incentivesCard]}
            onPress={handleIncentivesPress}
          >
            <Text numberOfLines={1} style={styles.statusLabel}>
              Incentive
            </Text>
            <Text style={styles.statusNumber}>₹{payoutData.incentives}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusCard, styles.penaltiesCard]}
            onPress={handlePenaltiesPress}
          >
            <Text numberOfLines={1} style={styles.statusLabel}>
              Penalties
            </Text>
            <Text style={styles.statusNumber}>₹{payoutData.penalties}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {modalView !== "daily" && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setModalView("daily");
                    setSelectedStatus(null);
                  }}
                >
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {modalView === "daily"
                  ? selectedTab === "Today"
                    ? "Order Details"
                    : "Daily Earnings"
                  : modalView === "delivered"
                  ? "Delivered Orders"
                  : modalView === "notDelivered"
                  ? "Not Delivered Orders"
                  : modalView === "incentives"
                  ? "Incentive Orders"
                  : modalView === "penalties"
                  ? "Penalty Orders"
                  : `Orders for ${selectedDate}`}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowOrderDetailsModal(false);
                  setSelectedStatus(null);
                }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={[
                  styles.pageButton,
                  currentPage === 1 && styles.disabledPageButton
                ]}
              >
                <Text style={[
                  styles.pageButtonText,
                  currentPage === 1 && styles.disabledPageButtonText
                ]}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.pageRangeText}>
                {modalView === "delivered"
                  ? `Showing ${deliveredStartIndex}–${deliveredEndIndex} of ${totalDeliveredItems} items`
                  : modalView === "notDelivered"
                  ? `Showing ${notDeliveredStartIndex}–${notDeliveredEndIndex} of ${totalNotDeliveredItems} items`
                  : modalView === "penalties"
                  ? `Showing ${penaltyStartIndex}–${penaltyEndIndex} of ${totalPenaltyItems} items`
                  : modalView === "incentives"
                  ? `Showing ${incentiveStartIndex}–${incentiveEndIndex} of ${totalIncentiveItems} items`
                  : modalView === "orders" && selectedDate
                  ? `Showing ${startIndex}–${Math.min(currentPage * itemsPerPage, dateWiseEarnings.find(day => day.date === selectedDate)?.orders.length || 0)} of ${dateWiseEarnings.find(day => day.date === selectedDate)?.orders.length || 0} items`
                  : `Showing ${dailyStartIndex}–${dailyEndIndex} of ${totalDailyItems} items`}
              </Text>

              <TouchableOpacity
                onPress={() => setCurrentPage((prev) => prev + 1)}
                disabled={
                  modalView === "delivered" 
                    ? currentPage * itemsPerPage >= totalDeliveredItems
                    : modalView === "notDelivered"
                    ? currentPage * itemsPerPage >= totalNotDeliveredItems
                    : modalView === "penalties"
                    ? currentPage * itemsPerPage >= totalPenaltyItems
                    : modalView === "incentives"
                    ? currentPage * itemsPerPage >= totalIncentiveItems
                    : modalView === "orders" && selectedDate
                    ? currentPage * itemsPerPage >= (dateWiseEarnings.find(day => day.date === selectedDate)?.orders.length || 0)
                    : currentPage * itemsPerPage >= totalDailyItems
                }
                style={[
                  styles.pageButton,
                  (modalView === "delivered" 
                    ? currentPage * itemsPerPage >= totalDeliveredItems
                    : modalView === "notDelivered"
                    ? currentPage * itemsPerPage >= totalNotDeliveredItems
                    : modalView === "penalties"
                    ? currentPage * itemsPerPage >= totalPenaltyItems
                    : modalView === "incentives"
                    ? currentPage * itemsPerPage >= totalIncentiveItems
                    : modalView === "orders" && selectedDate
                    ? currentPage * itemsPerPage >= (dateWiseEarnings.find(day => day.date === selectedDate)?.orders.length || 0)
                    : currentPage * itemsPerPage >= totalDailyItems) && styles.disabledPageButton
                ]}
              >
                <Text style={[
                  styles.pageButtonText,
                  (modalView === "delivered" 
                    ? currentPage * itemsPerPage >= totalDeliveredItems
                    : modalView === "notDelivered"
                    ? currentPage * itemsPerPage >= totalNotDeliveredItems
                    : modalView === "penalties"
                    ? currentPage * itemsPerPage >= totalPenaltyItems
                    : modalView === "incentives"
                    ? currentPage * itemsPerPage >= totalIncentiveItems
                    : modalView === "orders" && selectedDate
                    ? currentPage * itemsPerPage >= (dateWiseEarnings.find(day => day.date === selectedDate)?.orders.length || 0)
                    : currentPage * itemsPerPage >= totalDailyItems) && styles.disabledPageButtonText
                ]}>Next</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {modalView === "daily" ? (
                <ScrollView
                  style={styles.tableContainer}
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                >
                  <View>
                    {/* Daily Earnings Table Header */}
                    <View style={styles.tableRow}>
                      {selectedTab === "Today" ? (
                        <>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Txn ID</Text>
                          </View>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Status</Text>
                          </View>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Earning</Text>
                          </View>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Remarks</Text>
                          </View>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Payment Date</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Date</Text>
                          </View>
                          <View style={[styles.tableCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Earning</Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Daily Earnings Table Body */}
                    {selectedTab === "Today"
                      ? payoutData.orderDetails.map((order, index) => (
                          <View key={index} style={styles.tableRow}>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>{order.txnId}</Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text
                                style={[
                                  styles.cellText,
                                  order.deliveryStatus === "Z-Delivered"
                                    ? styles.deliveredText
                                    : styles.notDeliveredText,
                                ]}
                              >
                                {order.deliveryStatus}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                ₹
                                {order.baseEarning +
                                  order.incentives -
                                  order.penalties}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                {order.remarks || "-"}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                {order.paymentDate || "-"}
                              </Text>
                            </View>
                          </View>
                        ))
                      : getPaginatedData(
                          dateWiseEarnings.map((day, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.tableRow}
                              onPress={() => handleDatePress(day.date)}
                            >
                              <View style={styles.tableCell}>
                                <Text
                                  style={[
                                    styles.cellText,
                                    {
                                      color: "blue",
                                      textDecorationLine: "underline",
                                    },
                                  ]}
                                >
                                  {day.date}
                                </Text>
                              </View>
                              <View style={styles.tableCell}>
                                <Text style={styles.cellText}>
                                  ₹
                                  {day.baseEarning +
                                    day.incentives -
                                    day.penalties}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                  </View>
                </ScrollView>
              ) : (
                <ScrollView
                  style={styles.tableContainer}
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                >
                  <View>
                    <View style={[styles.tableRow, styles.headerRow]}>
                      <View style={[styles.tableCell, styles.headerCell]}>
                        <Text style={styles.headerText}>Txn ID</Text>
                      </View>
                      <View style={[styles.tableCell, styles.headerCell]}>
                        <Text style={styles.headerText}>Status</Text>
                      </View>
                      <View style={[styles.tableCell, styles.headerCell]}>
                        <Text style={styles.headerText}>
                          {modalView === "incentives"
                            ? "Incentive"
                            : modalView === "penalties"
                            ? "Penalty"
                            : "Earning"}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, styles.headerCell]}>
                        <Text style={styles.headerText}>Remarks</Text>
                      </View>
                      <View style={[styles.tableCell, styles.headerCell]}>
                        <Text style={styles.headerText}>Payment Date</Text>
                      </View>
                    </View>
                    {/* Order Details Table Header */}

                    {/* Order Details Table Body */}
                    {modalView === "orders" && selectedDate
                      ? // Show orders for the selected date from dateWiseEarnings with pagination
                        getPaginatedData(
                          dateWiseEarnings
                            .find((day) => day.date === selectedDate)
                            ?.orders || []
                        ).map((order, index) => (
                          <View key={index} style={styles.tableRow}>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                {order.txnId}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text
                                style={[
                                  styles.cellText,
                                  order.deliveryStatus === "Z-Delivered"
                                    ? styles.deliveredText
                                    : styles.notDeliveredText,
                                ]}
                              >
                                {order.deliveryStatus}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                ₹
                                {order.baseEarning +
                                  order.incentives -
                                  order.penalties}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                {order.remarks || "-"}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.cellText}>
                                {order.paymentDate || "-"}
                              </Text>
                            </View>
                          </View>
                        ))
                      : // Show filtered orders from payoutData for other views
                        getPaginatedData(
                          payoutData.orderDetails
                            .filter((order) => {
                              if (modalView === "delivered") {
                                return order.deliveryStatus === "Z-Delivered";
                              }
                              if (modalView === "notDelivered") {
                                return order.deliveryStatus !== "Z-Delivered";
                              }
                              if (modalView === "incentives") {
                                return (order.incentives || 0) > 0;
                              }
                              if (modalView === "penalties") {
                                return (order.penalties || 0) > 0;
                              }
                              return true;
                            })
                            .map((order, index) => (
                              <View key={index} style={styles.tableRow}>
                                <View style={styles.tableCell}>
                                  <Text style={styles.cellText}>
                                    {order.txnId}
                                  </Text>
                                </View>
                                <View style={styles.tableCell}>
                                  <Text
                                    style={[
                                      styles.cellText,
                                      order.deliveryStatus === "Z-Delivered"
                                        ? styles.deliveredText
                                        : styles.notDeliveredText,
                                    ]}
                                  >
                                    {order.deliveryStatus}
                                  </Text>
                                </View>
                                <View style={styles.tableCell}>
                                  <Text
                                    style={[
                                      styles.cellText,
                                      modalView === "incentives"
                                        ? styles.incentiveText
                                        : modalView === "penalties"
                                        ? styles.penaltyText
                                        : styles.earningText,
                                    ]}
                                  >
                                    {modalView === "incentives"
                                      ? `₹${order.incentives}`
                                      : modalView === "penalties"
                                      ? `₹${order.penalties}`
                                      : `₹${
                                          order.baseEarning +
                                          order.incentives -
                                          order.penalties
                                        }`}
                                  </Text>
                                </View>

                                <View style={styles.tableCell}>
                                  <Text style={styles.cellText}>
                                    {order.remarks || "-"}
                                  </Text>
                                </View>
                                <View style={styles.tableCell}>
                                  <Text style={styles.cellText}>
                                    {order.paymentDate || "-"}
                                  </Text>
                                </View>
                              </View>
                            ))
                        )}
                  </View>
                </ScrollView>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  pageButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginHorizontal: 10,
  },
  pageButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  pageIndicator: {
    paddingTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },

  pageRangeText: {
    textAlign: "center",
    marginVertical: 8,
    color: "#555",
    fontSize: 14,
  },

  driverCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  driverBasicInfo: {
    flex: 1,
  },
  driverCode: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  driverInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  riderCodeLabel: {
    fontSize: 16,
    color: "#2196F3",
  },
  riderCodeValue: {
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "500",
  },
  hubContainer: {
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hubText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "500",
  },
  totalEarningsContainer: {
    width: 120,
    marginLeft: 16,
  },
  totalEarningsLabel: {
    fontSize: 17,
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  totalEarningsCard: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  totalEarningsAmount: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
    height: 45,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: "#4CAF50",
    borderRadius: 6,
  },
  tabText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
    width: "100%",
  },
  activeTabText: {
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    minHeight: 80,
  },
  ordersCard: {
    flex: 1,
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    minHeight: 80,
  },
  cardTitle: {
    color: "white",
    fontSize: 14,
    marginBottom: 8,
    width: "100%",
  },
  earningsAmount: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  ordersCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  deliverySection: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusCard: {
    width: "48%",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  deliveredCard: {
    backgroundColor: "#4CAF50",
  },
  notDeliveredCard: {
    backgroundColor: "#FF5722",
  },
  incentivesCard: {
    backgroundColor: "#2196F3",
  },
  penaltiesCard: {
    backgroundColor: "#F44336",
  },
  statusLabel: {
    color: "white",
    fontSize: 13,
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
  },
  statusNumber: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  dateSelectionContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  datePickerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dateArrow: {
    paddingHorizontal: 12,
  },
  dateArrowText: {
    fontSize: 20,
    color: "#666",
  },
  datePickerButtonSelected: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  datePickerButtonDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
  },
  datePickerTextDisabled: {
    color: "#999",
  },
  datePickerHeader: {
    backgroundColor: "#4CAF50",
    padding: 12,
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  datePickerHeaderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 0,
    width: "90%",
    maxHeight: "80%",
    flex: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#E9ECEF",
  },
  backButtonText: {
    fontSize: 20,
    color: "#6C757D",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#E9ECEF",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6C757D",
  },
  modalScrollView: {
    flex: 1,
    width: "100%",
    paddingLeft: "20px",
  },
  dateScrollView: {
    flex: 1,
    width: "100%",
    paddingLeft: "20px",
  },
  tableContainer: {
    padding: 16,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  headerRow: {
    backgroundColor: "#F8F9FA",
    marginBottom: 12,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
  },
  tableCell: {
    padding: 12,
    minWidth: 120,
    maxWidth: 150,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#F0F0F0",
    flex: 1,
  },
  headerCell: {
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 0,
  },
  headerText: {
    fontWeight: "700",
    color: "#2C3E50",
    fontSize: 15,
    textAlign: "center",
  },
  cellText: {
    color: "#2C3E50",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    flexWrap: "wrap",
  },
  deliveredText: {
    color: "#28A745",
    fontWeight: "600",
  },
  notDeliveredText: {
    color: "#DC3545",
    fontWeight: "600",
  },
  incentiveText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  penaltyText: {
    color: "#F44336",
    fontWeight: "600",
  },
  earningText: {
    color: "#2C3E50",
    fontWeight: "600",
  },
  disabledPageButton: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  disabledPageButtonText: {
    color: '#666666',
  },
});

export default PayoutScreen;
