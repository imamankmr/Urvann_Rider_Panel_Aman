import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';
import { MaterialIcons } from '@expo/vector-icons';

const ProductDetailsScreen = ({ route }) => {
  const { sellerName, driverName } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderCodeQuantities, setOrderCodeQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://192.168.1.6:5001/api/products`, {
          params: {
            seller_name: sellerName,
            rider_code: driverName
          }
        });
        setProducts(response.data.products);
        setOrderCodeQuantities(response.data.orderCodeQuantities);
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

  const toggleSelectAll = async () => {
    const newStatus = !selectAll ? "Picked" : "Not Picked";
    setSelectAll(!selectAll);

    try {
      await axios.post('http://192.168.1.6:5001/api/update-pickup-status-bulk', {
        sellerName,
        driverName,
        status: newStatus
      });
      setProducts(prevProducts =>
        prevProducts.map(product => ({
          ...product,
          "Pickup Status": newStatus
        }))
      );
    } catch (error) {
      console.error('Error updating pickup status in bulk:', error);
    }
  };

  const toggleProductStatus = async (sku, orderCode) => {
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
      await axios.post('http://192.168.1.6:5001/api/update-pickup-status', {
        sku,
        orderCode,
        status: newStatus
      });
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
        <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllContainer}>
          <Text style={styles.selectAllText}>{selectAll ? "Unselect All" : "Select All"}</Text>
        </TouchableOpacity>
        {groupedProducts[finalCode].map((product, index) => (
          <TouchableWithoutFeedback key={index} onPress={() => toggleProductStatus(product.line_item_sku, finalCode)}>
            <View style={[styles.productContainer, product["Pickup Status"] === "Picked" ? styles.picked : styles.notPicked]}>
              <TouchableOpacity onPress={() => handleImagePress(product)}>
                <Image source={{ uri: product.image1 }} style={styles.image} />
              </TouchableOpacity>
              <View style={styles.textContainer}>
                <Text style={styles.text}>SKU: {product.line_item_sku}</Text>
                <Text style={styles.text}>Name: {product.line_item_name}</Text>
                <Text style={styles.text}>Quantity: {product.total_item_quantity}</Text>
                <Text style={[styles.statusText, product["Pickup Status"] === "Picked" ? styles.pickedStatus : styles.notPickedStatus]}>
                  {product["Pickup Status"]}
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
  wrapper: {},
  scrollViewContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '90%',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  subHeader: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '90%',
    alignSelf: 'center',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
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
    marginTop: 10,
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default ProductDetailsScreen;