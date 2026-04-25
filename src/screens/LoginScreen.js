import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Alert } from 'react-native';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (email.trim() && password.trim()) {
      try {
        const res = await fetch(`${BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
          await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
          navigation.replace('ChatList', { currentUser: data.user });
        } else {
          Alert.alert("Login Failed", data.error || "Wrong Credentials");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Connection Failed", `Failed to reach server at ${BASE_URL}. Check your Network IP!`);
      }
    } else {
      Alert.alert('Validation Error', 'Please enter your email and password');
    }
  };

  return (
    <LinearGradient colors={['#4A90E2', '#2A4365']} style={styles.gradientContainer}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <View style={styles.formContainer}>
            
            {/* Header Text overlaying the gradient */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>
            
            {/* Floating White Card */}
            <View style={styles.inputCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
                <LinearGradient colors={['#4A90E2', '#3182CE']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.button}>
                  <Text style={styles.buttonText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text></Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { marginBottom: 35, paddingHorizontal: 5 },
  title: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#E2E8F0', opacity: 0.9, fontWeight: '500' },
  inputCard: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B' },
  button: { padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  linkButton: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#64748B', fontSize: 15 },
  linkTextBold: { color: '#4A90E2', fontWeight: '800' }
});
