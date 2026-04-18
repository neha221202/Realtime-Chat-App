import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import io from 'socket.io-client';

export default function ChatListScreen({ navigation, route }) {
  const currentUser = route?.params?.currentUser || 'Guest';
  const [usersList, setUsersList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Screen active track karne ke liye
  const isFocused = useIsFocused();
  const focusRef = useRef(isFocused);

  // Without reconnecting socket, keep focus state updated internally
  useEffect(() => {
    focusRef.current = isFocused;
  }, [isFocused]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`);
      const data = await res.json();
      
      const filteredUsers = data.filter(u => u.email !== currentUser);
      setUsersList(filteredUsers);
    } catch (err) {
      console.error("Error fetching users list: ", err);
    }
  };

  useEffect(() => {
    // 1. App load hote hi list layega
    fetchUsers();

    // 2. Notification Badge Mechanism
    const newSocket = io(BASE_URL);
    newSocket.on('receiveMessage', (message) => {
        // Alert ONLY works if the user is literally looking at ChatListScreen!
        // Chat khula hone (ChatScreen me active hone) par ye focus false hota hai so alert nahi hoga.
        if (message.sender !== currentUser && focusRef.current) {
            Alert.alert(`📩 Naya Message from ${message.sender}`, message.text);
        }
    });

    return () => newSocket.disconnect();
  }, [currentUser]);

  // Handle Refresh Action (Pull ya Button click par)
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Chat', { username: item.name, currentUser })}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{item.name}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.email}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Available Contacts</Text>
          
          {/* Custom Refresh Button for visible action */}
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh-circle" size={24} color="#4A90E2" />
              <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
      </View>

      <FlatList 
        data={usersList}
        keyExtractor={item => item._id?.toString() || item.email}
        renderItem={renderItem}
        contentContainerStyle={styles.listArea}
        showsVerticalScrollIndicator={false}
        // Pull-to-refresh control standard design
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]} />
        }
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={50} color="#CBD5E1" />
                <Text style={styles.emptyText}>Abhi koi user database me nahi hai.</Text>
                <Text style={styles.emptySubText}>Kisi aor device se Signup karke Refresh ki tab dabayei !</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 5 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  refreshText: { color: '#4A90E2', fontWeight: 'bold', marginLeft: 4, fontSize: 14 },
  listArea: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30 },
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#4A90E2', fontSize: 22, fontWeight: '800' },
  infoContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  name: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 15, color: '#64748B', flex: 1, paddingRight: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  emptySubText: { color: '#94A3B8', fontSize: 14, marginTop: 5, textAlign: 'center' }
});
