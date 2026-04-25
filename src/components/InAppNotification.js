import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, PanResponder, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const InAppNotification = ({ message, onHide, navigation }) => {
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (message) {
      show();
      const timer = setTimeout(() => {
        hide();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const show = () => {
    setVisible(true);
    Animated.spring(translateY, {
      toValue: 20,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onHide();
    });
  };

  if (!visible || !message) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }] }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        activeOpacity={0.9}
        onPress={() => {
            hide();
            // Handle navigation to chat if needed
        }}
      >
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{message.sender.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {message.sender.split('@')[0]}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {message.text}
          </Text>
        </View>
        <TouchableOpacity onPress={hide} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    zIndex: 9999,
    backgroundColor: '#FFF',
    borderRadius: 15,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    // Android Shadow
    elevation: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#4A90E2', // App Theme Color
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  closeBtn: {
    padding: 5,
  },
});

export default InAppNotification;
