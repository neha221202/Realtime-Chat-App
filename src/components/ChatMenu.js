import React from 'react';
import { View, Text, Modal, TouchableWithoutFeedback, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const ChatMenu = ({ visible, onClose, onClearChat, isGroup, isAdmin, onLeaveGroup, onDeleteGroup, onEditGroup, onAddParticipants }) => {
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
            {!isGroup && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                  <Text style={styles.menuText}>View Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                  <Text style={styles.menuText}>Mute Notifications</Text>
                </TouchableOpacity>
              </>
            )}

            {isGroup && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => isAdmin ? onAddParticipants() : Alert.alert("Permission Denied", "Only the admin can add participants.")}>
                  <Text style={[styles.menuText, !isAdmin && { color: '#999' }]}>Add Participants</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => isAdmin ? onEditGroup() : Alert.alert("Permission Denied", "Only the admin can edit the group name.")}>
                  <Text style={[styles.menuText, !isAdmin && { color: '#999' }]}>Edit Group Name</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => isAdmin ? onDeleteGroup() : Alert.alert("Permission Denied", "Only the admin can delete the group.")}>
                  <Text style={[styles.menuText, { color: isAdmin ? '#E63946' : '#999', fontWeight: 'bold' }]}>Delete Group</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={onLeaveGroup}>
                  <Text style={[styles.menuText, { color: '#E63946' }]}>Leave Group</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={onClearChat}>
              <Text style={styles.menuText}>Clear Chat</Text>
            </TouchableOpacity>
            
            {!isGroup && (
              <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                <Text style={styles.menuText}>Block</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  menuContainer: {
    position: 'absolute', top: 40, right: 10, backgroundColor: '#FFF',
    borderRadius: 8, paddingVertical: 5, minWidth: 160, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 20 },
  menuText: { fontSize: 16, color: '#333' },
});

export default ChatMenu;
