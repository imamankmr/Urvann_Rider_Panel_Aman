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
        const response = await axios.get(`http://10.5.16.226:5001${endpoint}`, {
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
      await axios.post('http://10.5.16.226:5001/api/update-delivery-status-bulk', {
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
      await axios.post('http://10.5.16.226:5001/api/update-delivery-status', {
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
  },
  wrapper: {},
  scrollViewContainer: {
    paddingVertical: 10,
  },
  orderContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
  },
  selectAllContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  selectAllText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productContainer: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  delivered: {
    backgroundColor: '#d4edda',
  },
  notDelivered: {
    backgroundColor: '#f8d7da',
  },
  textContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveredStatus: {
    color: '#155724',
  },
  notDeliveredStatus: {
    color: '#721c24',
  },
  image: {
    width: 80,
    height: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ReverseProductDetailsScreen;
