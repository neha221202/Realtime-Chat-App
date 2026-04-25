import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textMove = useRef(new Animated.Value(20)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations for a premium feel
    Animated.sequence([
      // 1. Logo Pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      // 2. Text Fades and Slides Up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textMove, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]),
      // 3. Footer Fades In
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Route logic
    const timer = setTimeout(async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          navigation.replace('ChatList', { currentUser: parsedUser });
        } else {
          navigation.replace('Login');
        }
      } catch (err) {
        navigation.replace('Login');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#ffffff', '#f0f7ff']}
      style={styles.container}
    >
      <View style={styles.centerContent}>
        <Animated.View style={[
          styles.logoWrapper, 
          { 
            transform: [{ scale: logoScale }], 
            opacity: logoOpacity 
          }
        ]}>
          <View style={styles.logoCircle}>
            <Ionicons name="chatbubbles" size={60} color="#4A90E2" />
          </View>
        </Animated.View>

        <Animated.View style={{ 
          opacity: textOpacity, 
          transform: [{ translateY: textMove }],
          alignItems: 'center' 
        }}>
          <Text style={styles.title}>My Chat</Text>
          <Text style={styles.subtitle}>Secure • Fast • Simple</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.footerLabel}>from</Text>
        <Text style={styles.footerBrand}>MY TEAM</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoWrapper: {
    marginBottom: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  logoCircle: {
    width: 120,
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  title: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#1E293B', 
    letterSpacing: 1 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#64748B', 
    marginTop: 5, 
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    letterSpacing: 3,
  }
});
