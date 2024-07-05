import { API_BASE_URL } from '@env';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';

const ProductDetailsScreen = ({ route }) => {
  const { sellerName, riderCode } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderCodeQuantities, setOrderCodeQuantities] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://192.168.0.73:5001/api/products`, {
          params: {
            seller_name: sellerName,
            rider_code: riderCode
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
  }, [sellerName, riderCode]);

  const handleImagePress = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Group products by Final code
  const groupedProducts = {};
  products.forEach(product => {
    if (!groupedProducts[product['FINAL']]) {
      groupedProducts[product['FINAL']] = [];
    }
    groupedProducts[product['FINAL']].push(product);
  });

  // Sort the final codes in ascending order
  const sortedFinalCodes = Object.keys(groupedProducts).sort((a, b) => a.localeCompare(b));

  return (
    <View style={styles.container}>
      <Swiper style={styles.wrapper} showsButtons loop={false}>
        {sortedFinalCodes.map(finalCode => (
          <ScrollView key={finalCode} contentContainerStyle={styles.scrollViewContainer}>
            <View style={styles.orderContainer}>
              <Text style={styles.header}>Order Code: {finalCode}</Text>
              <Text style={styles.subHeader}>Total Quantity: {orderCodeQuantities[finalCode]}</Text>
            </View>
            {groupedProducts[finalCode].map((product, index) => (
              <TouchableWithoutFeedback key={index} onPress={() => handleImagePress(product)}>
                <View style={styles.productContainer}>
                  <Image source={{ uri: product.image1 }} style={styles.image} />
                  <View style={styles.textContainer}>
                    <Text style={styles.text}>SKU: {product.line_item_sku}</Text>
                    <Text style={styles.text}>Name: {product.line_item_name}</Text>
                    <Text style={styles.text}>Quantity: {product.total_item_quantity}</Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </ScrollView>
        ))}
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
                {/* Add other product details here */}
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
  orderContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '90%',
    alignItems: 'center',
    alignSelf: 'center',
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
