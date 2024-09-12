import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';
import { BACKEND_URL } from 'react-native-dotenv';

const ProductDetailsScreen = ({ route }) => {
  const { sellerName, driverName, endpoint } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderCodeQuantities, setOrderCodeQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectAll, setSelectAll] = useState({});
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
          params: {
            seller_name: sellerName,
            rider_code: driverName
          }
        });

        const { products, orderCodeQuantities, lockStatus } = response.data;

        if (lockStatus === undefined) {
          console.error('Error: lockStatus is undefined');
          return;
        }

        const isLocked = lockStatus.trim() === 'close';
        console.log('isLocked:', isLocked);

        setProducts(products);
        setOrderCodeQuantities(orderCodeQuantities);
        setIsLocked(isLocked);

        const initialSelectAll = {};
        products.forEach(product => {
          if (!initialSelectAll[product.FINAL]) {
            initialSelectAll[product.FINAL] = true;
          }
          if (product["Pickup Status"] === "Not Picked") {
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
  }, [sellerName, driverName, endpoint]);

  const handleImagePress = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const toggleSelectAll = async (finalCode) => {
    if (isLocked) return; // Prevent changes if locked
  
    const newStatus = !selectAll[finalCode] ? "Picked" : "Not Picked";
    setSelectAll(prev => ({ ...prev, [finalCode]: !prev[finalCode] }));
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/update-pickup-status-bulk`, {
        sellerName,
        driverName,
        finalCode,
        status: newStatus
      });
  
      if (response.status === 403) {
        console.error('Pickup status cannot be updated. The routes are locked for this driver.');
        alert('Pickup status cannot be updated as the driver\'s routes are locked.');
        return;
      }
  
      const updatedProducts = products.map(product =>
        product.FINAL === finalCode ? { ...product, "Pickup Status": newStatus } : product
      );
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating pickup status in bulk:', error);
    }
  };

  const toggleProductStatus = async (sku, orderCode) => {
    if (isLocked) return; // Prevent changes if locked
  
    const updatedProducts = products.map(product => {
      if (product.line_item_sku === sku && product.FINAL === orderCode) {
        const newStatus = product["Pickup Status"] === "Not Picked" ? "Picked" : "Not Picked";
        return { ...product, "Pickup Status": newStatus };
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
  
      const newStatus = productToUpdate["Pickup Status"];
      const response = await axios.post(`${BACKEND_URL}/api/update-pickup-status`, {
        sku,
        orderCode,
        status: newStatus
      });
  
      if (response.status === 403) {
        console.error('Pickup status cannot be updated. The routes are locked for this driver.');
        alert('Pickup status cannot be updated as the driver\'s routes are locked.');
        return;
      }
  
      const allPicked = updatedProducts.filter(product => product.FINAL === orderCode).every(product => product["Pickup Status"] === "Picked");
      const allNotPicked = updatedProducts.filter(product => product.FINAL === orderCode).every(product => product["Pickup Status"] === "Not Picked");
  
      setSelectAll(prev => ({ ...prev, [orderCode]: allPicked ? true : allNotPicked ? false : false }));
    } catch (error) {
      console.error('Error updating pickup status:', error);
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
        <TouchableOpacity 
          onPress={() => !isLocked && toggleSelectAll(finalCode)} // Disable if locked
          style={[styles.selectAllContainer, isLocked ? styles.locked : {}]} // Style changes when locked
          disabled={isLocked} // Disable if locked
        >
          <Text style={styles.selectAllText}>{selectAll[finalCode] ? "Unselect All" : "Select All"}</Text>
        </TouchableOpacity>
        {groupedProducts[finalCode].map((product, index) => (
          <TouchableWithoutFeedback 
            key={index}
            onPress={() => !isLocked && toggleProductStatus(product.line_item_sku, finalCode)} // Disable if locked
          >
            <View style={[styles.productContainer, product["Pickup Status"] === "Picked" ? styles.picked : styles.notPicked]}>
              <TouchableOpacity onPress={() => handleImagePress(product)}>
                <Image source={{ uri: product.image1 }} style={styles.image} />
              </TouchableOpacity>
              <View style={styles.textContainer}>
                <Text style={styles.text}>
                  <Text style={styles.boldText}>SKU: </Text>{product.line_item_sku}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.boldText}>Name: </Text>{product.line_item_name}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.boldText}>Quantity: </Text>{product.total_item_quantity}
                </Text>
                <Text
                  style={[
                    styles.statusText,
                    product["Pickup Status"] === "Picked" ? styles.pickedStatus : styles.notPickedStatus,
                  ]}
                >
                  {product["Pickup Status"]}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    ));
  }, [products, orderCodeQuantities, selectAll, isLocked]); // Include isLocked in dependencies  

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
    backgroundColor: '#f0f4f8',
    paddingTop: 20,
  },
  wrapper: {},
  scrollViewContainer: {
    flexGrow: 1,
    backgroundColor: '#f0f4f8',
  },
  orderContainer: {
    backgroundColor: '#ffffff', // Consistent color for orderContainer
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    marginBottom: 15,
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
    fontSize: 18, // Slightly smaller font size for headers
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18, // Slightly smaller font size for sub-headers
    color: '#555',
    textAlign: 'center',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 10, // Reduce margin to make it more compact
    backgroundColor: '#ffffff', // Consistent color for productContainer
    padding: 12, // Reduce padding for a smaller container
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
    width: 100, // Reduce the size of the image
    height: 100,
    resizeMode: 'cover',
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff', // Same background color for image container
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14, // Smaller font size
    marginBottom: 1, // Reduced spacing between text elements
  },
  boldText: {
    fontWeight: 'bold', // Only bold for the label text
  },
  statusText: {
    fontSize: 14, // Smaller font size for status text
    fontWeight: 'bold',
    marginTop: 1, // Reduced margin to bring status text closer to quantity
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
    backgroundColor: '#ffffff', // Consistent color for fullScreenImage
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


export default ProductDetailsScreen;