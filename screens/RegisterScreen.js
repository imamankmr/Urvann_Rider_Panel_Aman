import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from 'react-native-dotenv';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const filterInput = (text) => {
    return text.trim();
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/register`, { username, password });
      if (response.status === 201) {
        Alert.alert(`Registration successful ${username}, You can now login.`);
        navigation.navigate('Login');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Alert.alert(`Username ${username} already registered`);
      } else {
        console.error('Error during registration:', error);
        Alert.alert('Registration failed', 'An error occurred. Please try again.');
      }
    }
  };

  return (
    <LinearGradient colors={['#f9f9f9', '#287238']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              <Image source={require('../assets/urvann.png')} style={styles.logo} />
              <Text style={styles.title}>Register</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor="#888"
                value={username}
                onChangeText={(text) => setUsername(text)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={(text) => setPassword(text)}
                secureTextEntry={!showPassword} // Toggles password visibility
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="#287238" />
              </TouchableOpacity>
            </View>
              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
              <View style={styles.loginPromptContainer}>
                <Text style={styles.registerLinkText}>Already registered? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLinkText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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
  button: {
    backgroundColor: '#f8b314',
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
  loginPromptContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  registerLinkText: {
    color: '#333',
    fontSize: 18,
  },
  loginLinkText: {
    color: '#f8b314',
    fontSize: 18,
  },
});

export default RegisterScreen;
