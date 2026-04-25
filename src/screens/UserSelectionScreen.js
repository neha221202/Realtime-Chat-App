import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { BASE_URL } from '../config';

export default function UserSelectionScreen({ navigation, route }) {
  const { currentUser } = route.params;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    fetchUsers();
    const socket = io(BASE_URL);
    socket.on('statusUpdate', ({ userId, isOnline, lastSeen }) => {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline, lastSeen } : u));
      setFilteredUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline, lastSeen } : u));
    });
    return () => socket.disconnect();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`);
      const data = await res.json();
      const otherUsers = data.filter(u => u.email !== currentUser.email);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = text.toLowerCase();
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => navigation.navigate('Chat', { 
        username: item.name, 
        receiverEmail: item.email, 
        currentUser: currentUser, 
        receiverId: item._id, 
        receiverStatus: item.isOnline, 
        receiverLastSeen: item.lastSeen 
      })}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        {item.isOnline && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => isSearchMode ? setIsSearchMode(false) : navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {!isSearchMode ? (
            <View>
              <Text style={styles.headerTitle}>Select contact</Text>
              <Text style={styles.headerSubtitle}>{users.length} contacts</Text>
            </View>
          ) : (
            <TextInput 
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          )}
        </View>

        {!isSearchMode ? (
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsSearchMode(true)} style={styles.headerIcon}>
              <Ionicons name="search" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          )
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <FlatList 
          data={filteredUsers}
          keyExtractor={item => item._id || item.email}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: '#4A90E2',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 20 },
  headerTitle: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFF',
    fontSize: 13,
    opacity: 0.9,
  },
  headerIcon: {
    marginLeft: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    paddingVertical: 0,
  },
  listContent: { paddingVertical: 5 },
  userCard: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  avatarContainer: { marginRight: 15 },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: { color: '#4A90E2', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  userEmail: { fontSize: 14, color: '#666' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#64748B', fontSize: 16 },
});
