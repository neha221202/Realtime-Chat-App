import React from 'react';
import { View, Text, Modal, TouchableWithoutFeedback, TouchableOpacity, StyleSheet } from 'react-native';

const CustomMenu = ({ visible, onClose, onRefresh, onLogout, onNewGroup }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={onRefresh}>
              <Text style={styles.menuText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNewGroup(); }}>
              <Text style={styles.menuText}>New Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Text style={styles.menuText}>Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  menuContainer: {
    position: 'absolute', top: 50, right: 10, backgroundColor: '#FFF',
    borderRadius: 8, paddingVertical: 5, minWidth: 150, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 20 },
  menuText: { fontSize: 16, color: '#333' },
});

export default CustomMenu;
