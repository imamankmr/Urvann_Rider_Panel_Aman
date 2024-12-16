import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { BACKEND_URL } from 'react-native-dotenv';

const ProductDetailsScreen = ({ route }) => {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { order_code, metafield_order_type, driverName } = route.params;

  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/rtoscreen/product-details`, {
        params: {
          order_code: order_code,
          metafield_order_type: metafield_order_type,
          driverName,
        },
      });
      
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching product details');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [order_code, metafield_order_type]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProductDetails();
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#287238" />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {products && products.length > 0 && products.map((product) => (
        <View style={styles.productContainer} key={product.line_item_name + "-" + product.line_item_sku}>
          <Image source={{ uri: product.image1 }} style={styles.image} />
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              <Text style={styles.label}>Name: </Text>{product.line_item_name}
            </Text>
            <Text style={[styles.text, styles.noMargin]}>
              <Text style={styles.label}>SKU: </Text>{product.line_item_sku}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Quantity: </Text>{product.total_item_quantity}
            </Text>
            {/* Displaying pickup status without label */}
            <Text style={[styles.text, product.delivery_status === "Delivered" ? styles.deliveredStatus : styles.notDeliveredStatus]}>
              {product.delivery_status}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#ffffff',
    padding: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    width: '100%',
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
    fontSize: 14,
  },
  label: {
    fontWeight: 'bold',
  },
  noMargin: {
    marginBottom: -1, // Ensures no margin between SKU and Quantity
  },
  deliveredStatus: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  notDeliveredStatus: {
    fontWeight: 'bold',
    color: '#dc3545',
  },
});

export default ProductDetailsScreen;
