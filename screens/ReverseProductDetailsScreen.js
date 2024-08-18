import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReverseProductDetailsScreen = ({ route }) => {
  const { sellerName, driverName, endpoint } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderCodeQuantities, setOrderCodeQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectAll, setSelectAll] = useState({});

  // Function to save delivery status locally
  const saveDeliveryStatusLocally = async (sku, orderCode, status) => {
    try {
      await AsyncStorage.setItem(`${sku}_${orderCode}`, status);
    } catch (error) {
      console.error('Error saving delivery status:', error);
    }
  };

  // Function to load delivery status locally
  const loadDeliveryStatusLocally = async (sku, orderCode) => {
    try {
      const status = await AsyncStorage.getItem(`${sku}_${orderCode}`);
      return status || "Not Delivered";
    } catch (error) {
      console.error('Error loading delivery status:', error);
      return "Not Delivered";
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://10.5.16.225:5001${endpoint}`, {
          params: {
            seller_name: sellerName,
            rider_code: driverName
          }
        });
        
        const fetchedProducts = await Promise.all(response.data.products.map(async product => {
          const localStatus = await loadDeliveryStatusLocally(product.line_item_sku, product.FINAL);
          return {
            ...product,
            "Delivery Status": localStatus
          };
        }));

        setProducts(fetchedProducts);
        setOrderCodeQuantities(response.data.orderCodeQuantities);

        // Initialize selectAll based on the fetched products' status
        const initialSelectAll = {};
        fetchedProducts.forEach(product => {
          if (!initialSelectAll[product.FINAL]) {
            initialSelectAll[product.FINAL] = true;
          }
          if (product["Delivery Status"] === "Not Delivered") {
            initialSelectAll[product.FINAL] = false;
          }
        });
        setSelectAll(initialSelectAll);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sellerName, driverName]);

  const handleImagePress = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const toggleSelectAll = async (finalCode) => {
    const newStatus = !selectAll[finalCode] ? "Delivered" : "Not Delivered";
    setSelectAll(prev => ({ ...prev, [finalCode]: !prev[finalCode] }));
  
    try {
      await axios.post('http://10.5.16.225:5001/api/update-delivery-status-bulk', {
        sellerName,
        driverName,
        finalCode,
        status: newStatus
      });
      const updatedProducts = products.map(product =>
        product.FINAL === finalCode ? { ...product, "Delivery Status": newStatus } : product
      );
      setProducts(updatedProducts);
  
      await Promise.all(updatedProducts.map(async product => {
        if (product.FINAL === finalCode) {
          await saveDeliveryStatusLocally(product.line_item_sku, finalCode, newStatus);
        }
      }));
  
    } catch (error) {
      console.error('Error updating delivery status in bulk:', error);
    }
  };

  const toggleProductStatus = async (sku, orderCode) => {
    const updatedProducts = products.map(product => {
      if (product.line_item_sku === sku && product.FINAL === orderCode) {
        const newStatus = product["Delivery Status"] === "Not Delivered" ? "Delivered" : "Not Delivered";
        return { ...product, "Delivery Status": newStatus };
      }
      return product;
    });
  
    setProducts(updatedProducts);
  
    try {
      const productToUpdate = updatedProducts.find(product => product.line_item_sku === sku && product.FINAL === orderCode);
      if (!productToUpdate) {
        console.error(`Product with SKU ${sku} and order code ${orderCode} not found.`);
        return;
      }
      const newStatus = productToUpdate["Delivery Status"];
      await axios.post('http://10.5.16.225:5001/api/update-delivery-status', {
        sku,
        orderCode,
        status: newStatus
      });
  
      await saveDeliveryStatusLocally(sku, orderCode, newStatus);
  
      const allDelivered = updatedProducts.filter(product => product.FINAL === orderCode).every(product => product["Delivery Status"] === "Delivered");
      const allNotDelivered = updatedProducts.filter(product => product.FINAL === orderCode).every(product => product["Delivery Status"] === "Not Delivered");
  
      setSelectAll(prev => ({ ...prev, [orderCode]: allDelivered ? true : allNotDelivered ? false : false }));
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const renderProducts = useCallback(() => {
    const groupedProducts = {};
    products.forEach(product => {
      if (!groupedProducts[product['FINAL']]) {
        groupedProducts[product['FINAL']] = [];
      }
      groupedProducts[product['FINAL']].push(product);
    });

    const sortedFinalCodes = Object.keys(groupedProducts).sort((a, b) => a.localeCompare(b));

    return sortedFinalCodes.map(finalCode => (
      <ScrollView key={finalCode} contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.orderContainer}>
          <Text style={styles.header}>Order Code: {finalCode}</Text>
          <Text style={styles.subHeader}>Total Quantity: {orderCodeQuantities[finalCode]}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleSelectAll(finalCode)} style={styles.selectAllContainer}>
          <Text style={styles.selectAllText}>{selectAll[finalCode] ? "Unselect All" : "Select All"}</Text>
        </TouchableOpacity>
        {groupedProducts[finalCode].map((product, index) => (
          <TouchableWithoutFeedback key={index} onPress={() => toggleProductStatus(product.line_item_sku, finalCode)}>
            <View style={[styles.productContainer, product["Delivery Status"] === "Delivered" ? styles.delivered : styles.notDelivered]}>
              <TouchableOpacity onPress={() => handleImagePress(product)}>
                <Image source={{ uri: product.image1 }} style={styles.image} />
              </TouchableOpacity>
              <View style={styles.textContainer}>
                <Text style={styles.text}>SKU: {product.line_item_sku}</Text>
                <Text style={styles.text}>Name: {product.line_item_name}</Text>
                <Text style={styles.text}>Quantity: {product.total_item_quantity}</Text>
                <Text style={[styles.statusText, product["Delivery Status"] === "Delivered" ? styles.deliveredStatus : styles.notDeliveredStatus]}>
                  {product["Delivery Status"]}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    ));
  }, [products, orderCodeQuantities, selectAll]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper style={styles.wrapper} showsButtons loop={false}>
        {renderProducts()}
      </Swiper>

      {selectedProduct && (
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Image source={{ uri: selectedProduct.image1 }} style={styles.fullScreenImage} />
                <Text style={styles.modalText}>SKU: {selectedProduct.line_item_sku}</Text>
                <Text style={styles.modalText}>Name: {selectedProduct.line_item_name}</Text>
                <Text style={styles.modalText}>Quantity: {selectedProduct.total_item_quantity}</Text>
                <Text style={styles.modalText}>Delivery Status: {selectedProduct["Delivery Status"]}</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  scrollViewContainer: {
    paddingBottom: 20,
    // paddingTop: 10,
    backgroundColor: '#fff',
  },
  orderContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  selectAllContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '90%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#ffffff',
    padding: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
 
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    marginRight: 15,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  pickedStatus: {
    color: '#28a745',
  },
  notPickedStatus: {
    color: '#dc3545',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  fullScreenImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },

  picked: {
    backgroundColor: '#d4edda',
  },
  notPicked: {
    backgroundColor: '#f9f9f9',
  },
});

export default ReverseProductDetailsScreen;
