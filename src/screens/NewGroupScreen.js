import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../config';

export default function NewGroupScreen({ navigation, route }) {
  const { currentUser, isAddingMore, groupId, existingMembers } = route.params;
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users?email=${currentUser.email}`);
      const data = await res.json();
      
      let availableUsers = data.filter(u => u.email !== currentUser.email);
      if (isAddingMore && existingMembers) {
          availableUsers = availableUsers.filter(u => !existingMembers.some(em => em._id === u._id || em === u._id));
      }
      
      setUsers(availableUsers);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Selection Required", "Please select at least one participant.");
      return;
    }

    if (isAddingMore) {
      try {
        const memberIds = selectedUsers.map(u => u._id);
        await fetch(`${BASE_URL}/api/groups/addMembers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, memberIds, adminId: currentUser._id })
        });
        navigation.goBack();
      } catch (err) {
        Alert.alert("Error", "Failed to add members");
      }
    } else {
      navigation.navigate('GroupDetails', { 
        currentUser, 
        participants: selectedUsers 
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>New Group</Text>
          <Text style={styles.headerSubtitle}>
            {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Add participants'}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search participants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            data={selectedUsers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.selectedUser}>
                <View style={styles.avatarMini}>
                   <Text style={styles.avatarTextMini}>{item.name.charAt(0).toUpperCase()}</Text>
                   <TouchableOpacity 
                    style={styles.removeIcon} 
                    onPress={() => toggleUserSelection(item)}
                   >
                     <Ionicons name="close-circle" size={18} color="#64748B" />
                   </TouchableOpacity>
                </View>
                <Text style={styles.selectedUserName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 15 }}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isSelected = !!selectedUsers.find(u => u._id === item._id);
            return (
              <TouchableOpacity 
                style={styles.userItem} 
                onPress={() => toggleUserSelection(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={22} color="#4A90E2" />
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userStatus}>Hey there! I am using My Chat</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { opacity: selectedUsers.length > 0 ? 1 : 0.6 }]} 
        onPress={handleNext}
      >
        <Ionicons name="arrow-forward" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    height: 60, 
    backgroundColor: '#4A90E2', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15 
  },
  headerTitleContainer: { marginLeft: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    margin: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 45,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  selectedContainer: { 
    height: 90, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10
  },
  selectedUser: { width: 70, alignItems: 'center' },
  avatarMini: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  avatarTextMini: { fontSize: 20, fontWeight: 'bold', color: '#64748B' },
  removeIcon: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#FFF', borderRadius: 10 },
  selectedUserName: { fontSize: 12, color: '#64748B', marginTop: 4 },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  checkIcon: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#FFF', borderRadius: 11 },
  userInfo: { marginLeft: 15 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  userStatus: { fontSize: 13, color: '#64748B', marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.5,
  }
});
