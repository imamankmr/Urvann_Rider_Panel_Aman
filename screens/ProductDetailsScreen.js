import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Swiper from 'react-native-swiper';
import LazyLoad from 'react-lazyload';
import FastImage from 'react-native-fast-image';

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

  const toggleSelectAll = useCallback(async () => {
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
  }, [selectAll, sellerName, driverName]);

  const toggleProductStatus = useCallback(async (sku, orderCode) => {
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
  }, [products]);

  const handleImagePress = useCallback((product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

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
              <LazyLoad height={80}>
                <TouchableOpacity onPress={() => handleImagePress(product)}>
                  {product.image1 ? (
                    <FastImage source={{ uri: product.image1 }} style={styles.image} resizeMode={FastImage.resizeMode.cover} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>Image not available</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </LazyLoad>
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
  }, [products, orderCodeQuantities, selectAll, toggleSelectAll, toggleProductStatus, handleImagePress]);

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
                {selectedProduct.image1 ? (
                  <FastImage source={{ uri: selectedProduct.image1 }} style={styles.fullScreenImage} resizeMode={FastImage.resizeMode.contain} />
                ) : (
                  <View style={styles.fullScreenImagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Image not available</Text>
                  </View>
                )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  orderContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E0E0E0',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  selectAllContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  selectAllText: {
    fontSize: 16,
    color: '#007BFF',
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    elevation: 3,
  },
  picked: {
    backgroundColor: '#DFF0D8',
  },
  notPicked: {
    backgroundColor: '#F8D7DA',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#CCCCCC',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pickedStatus: {
    color: '#28A745',
  },
  notPickedStatus: {
    color: '#DC3545',
  },
  wrapper: {},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    minWidth: '80%',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
    marginBottom: 10,
    borderRadius: 10,
  },
  fullScreenImagePlaceholder: {
    width: '100%',
    height: '80%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ProductDetailsScreen;
