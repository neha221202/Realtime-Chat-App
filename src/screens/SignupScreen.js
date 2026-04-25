import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';

import { Alert } from 'react-native';
import { BASE_URL } from '../config';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (name.trim() && email.trim() && password.trim()) {
      try {
        const res = await fetch(`${BASE_URL}/api/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (data.success) {
          Alert.alert('Success ✨', 'Account Successfully Created! Please sign in now.');
          navigation.goBack();
        } else {
          Alert.alert("Signup Failed", data.error || "Please try again");
        }
      } catch (err) {
        Alert.alert("Connection Error", `Could not connect to ${BASE_URL}. Ensure Backend is running.`);
      }
    } else {
      Alert.alert('Validation', 'Please fill out all fields');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and start chatting</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

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
          
          <TouchableOpacity style={styles.button} onPress={handleSignup} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  title: { fontSize: 34, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 40 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B' },
  button: { backgroundColor: '#4A90E2', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  linkButton: { marginTop: 30, alignItems: 'center' },
  linkText: { color: '#64748B', fontSize: 15 },
  linkTextBold: { color: '#4A90E2', fontWeight: '700' }
});
