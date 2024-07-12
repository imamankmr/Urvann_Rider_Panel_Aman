import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedPassword = await AsyncStorage.getItem('password');
      const storedRememberMe = await AsyncStorage.getItem('rememberMe');

      if (storedRememberMe === 'true' && storedUsername && storedPassword) {
        setUsername(storedUsername);
        setPassword(storedPassword);
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`https://urvann-rider-panel.onrender.com/api/login`, { username, password });
      if (response.status === 200 && response.data.token) {
        Alert.alert('Login successful', `Welcome, ${username}!`);

        if (rememberMe) {
          await AsyncStorage.setItem('username', username);
          await AsyncStorage.setItem('password', password);
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('username');
          await AsyncStorage.removeItem('password');
          await AsyncStorage.removeItem('rememberMe');
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { driverName: username } }],
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Alert.alert('Login failed', 'Invalid credentials');
      } else {
        console.error('Error during login:', error);
        Alert.alert('Login failed', 'Driver does not exist');
      }
    }
  };

  return (
    
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={require('../assets/urvann.png')} style={styles.logo} />
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Driver login</Text>
            <TextInput
              style={styles.input}
              placeholder="Driver Name"
              placeholderTextColor="#888"
              value={username}
              onChangeText={(text) => setUsername(text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={(text) => setPassword(text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="#287238" />
              </TouchableOpacity>
            </View>
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                style={styles.rememberMeCheckbox}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe ? styles.checked : null]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.rememberMeText}>Remember Me</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.buttonText, styles.registerButtonText]}>New user? Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 40,
    marginBottom: 50,
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
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  passwordInput: {
    height: 50,
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 20,
    top: 10,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  rememberMeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#287238',
    borderColor: '#287238',
  },
  rememberMeText: {
    fontSize: 16,
    color: '#333',
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
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
    width: '100%',
  },
  registerButtonText: {
    color: '#4CAF50',
  },
});

export default LoginScreen;
