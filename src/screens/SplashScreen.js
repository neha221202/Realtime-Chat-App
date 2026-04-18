import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  // Animation values
  const scaleValue = useRef(new Animated.Value(0.3)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parallel Animations (Grow and Fade In at the same time)
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();

    // Automatically route to ChatList if session exists
    const timer = setTimeout(async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          navigation.replace('ChatList', { currentUser: storedUser });
        } else {
          navigation.replace('Login');
        }
      } catch (err) {
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>
        <Text style={styles.logoText}>💬</Text>
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: opacityValue }]}>NovaChat</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: opacityValue }]}>Connecting perfectly</Animated.Text>
      <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { width: 120, height: 120, backgroundColor: '#F8FAFC', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 5 },
  logoText: { fontSize: 60 },
  title: { fontSize: 44, fontWeight: '800', color: '#1E293B', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 8, fontWeight: '500' },
  loader: { marginTop: 50 }
});
