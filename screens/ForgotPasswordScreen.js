import { API_BASE_URL } from '@env';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(`https://urvann-seller-panel-yc3k.onrender.com/api/forgot-password`, { email });
      if (response.status === 200) {
        Alert.alert('Success', 'Password reset instructions have been sent to your email.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Failed', 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      Alert.alert('Failed', 'An error occurred. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#fff', '#fff']} style={styles.container}>
      <Image source={require('../assets/urvann.png')} style={styles.logo} />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Forgot Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logo: {
    marginTop: 100,
    width: 220,
    height: 40,
    marginBottom: 50,
  },
  innerContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    width: '100%',
  },
  button: {
    backgroundColor: '#287238',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
