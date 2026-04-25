import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FAB = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress}>
    <MaterialCommunityIcons name="message-text" size={24} color="#FFF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 25, right: 25, backgroundColor: '#4A90E2',
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center',
    alignItems: 'center', elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
  },
});

export default FAB;
