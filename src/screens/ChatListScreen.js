import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, RefreshControl, StatusBar, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { BASE_URL } from '../config';

// Import Modular Components
import ChatCard from '../components/ChatCard';
import CustomMenu from '../components/CustomMenu';
import FAB from '../components/FAB';

export default function ChatListScreen({ navigation, route }) {
  const currentUser = route?.params?.currentUser || 'Guest';
  const [usersList, setUsersList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFocused = useIsFocused();
  const focusRef = useRef(isFocused);
  useEffect(() => { focusRef.current = isFocused; }, [isFocused]);

  useEffect(() => {
    navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity style={{ marginRight: 15 }} onPress={() => navigation.navigate('UserSelection', { currentUser })}>
              <Ionicons name="search" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        )
      });
  }, [navigation, currentUser]);

  const fetchUsersAndGroups = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/users?email=${currentUser?.email}`),
        fetch(`${BASE_URL}/api/groups?userId=${currentUser?._id}`)
      ]);
      
      const usersData = await usersRes.json();
      const groupsData = await groupsRes.json();
      
      // Filter users who have at least one message
      const activeUsers = usersData.filter(u => u.email !== currentUser?.email && u.lastMessageTime !== '');
      
      // Mark groups as groups
      const markedGroups = groupsData.map(g => ({ ...g, isGroup: true }));
      
      // Merge and sort
      const merged = [...activeUsers, ...markedGroups].sort((a, b) => {
        // Simple string comparison for times like "12:00 PM" isn't ideal but works if times are consistent
        // Better to use updatedAt or a proper timestamp if available
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
      
      setUsersList(merged);
    } catch (err) {
      console.error("Error fetching chat list: ", err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchUsersAndGroups();
    }
  }, [isFocused]);

  useEffect(() => {
    const socket = io(BASE_URL);

    socket.on('connect', () => {
        if (currentUser?._id) {
            socket.emit('registerUser', currentUser._id);
        }
    });
    
    socket.on('statusUpdate', ({ userId, isOnline, lastSeen }) => {
        setUsersList(prev => prev.map(user => 
            user._id === userId ? { ...user, isOnline, lastSeen } : user
        ));
    });

    socket.on('receiveMessage', (message) => {
        const isMyMessage = message.sender === currentUser.email;
        const isForMe = message.receiver === currentUser.email || message.groupId;

        if (isMyMessage || isForMe) {
            setUsersList(prev => {
                const targetId = message.groupId || (isMyMessage ? message.receiver : message.sender);
                const userIndex = prev.findIndex(u => (u.groupId === targetId) || (u.email === targetId));
                
                if (userIndex === -1) {
                    fetchUsersAndGroups(); // New conversation, fetch full list
                    return prev;
                }

                const isIncoming = !isMyMessage;
                const updatedItem = { 
                    ...prev[userIndex], 
                    lastMessage: message.text, 
                    lastMessageType: message.messageType,
                    lastMessageTime: message.time || 'Now',
                    updatedAt: new Date().toISOString(),
                    unreadCount: (isIncoming && !focusRef.current) ? (prev[userIndex].unreadCount || 0) + 1 : prev[userIndex].unreadCount
                };

                const newList = [...prev];
                newList.splice(userIndex, 1);
                newList.unshift(updatedItem);
                return newList;
            });

            if (!isMyMessage && global.activeChat !== (message.groupId || message.sender)) {
                if (global.showNotification) global.showNotification(message);
            }
        }
    });

    return () => socket.disconnect();
  }, [currentUser]);

  const handleLogout = async () => {
    setMenuVisible(false);
    await AsyncStorage.removeItem('currentUser');
    navigation.replace('Login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsersAndGroups();
    setRefreshing(false);
  };

  const renderChatItem = useCallback(({ item }) => (
    <ChatCard 
      item={item} 
      onPress={() => navigation.navigate('Chat', { 
        username: item.name, 
        receiverEmail: item.isGroup ? null : item.email, 
        currentUser: currentUser, 
        receiverId: item.isGroup ? null : item._id, 
        groupId: item.isGroup ? item._id : null,
        isGroup: item.isGroup,
        receiverStatus: item.isOnline, 
        receiverLastSeen: item.lastSeen 
      })} 
    />
  ), [currentUser]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* WhatsApp style Tab Bar (Static) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.cameraIcon}>
          <Ionicons name="camera" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Text style={styles.tabTextActive}>CHATS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabText}>STATUS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabText}>CALLS</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={usersList}
        keyExtractor={(item) => item._id || item.email}
        renderItem={renderChatItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyText}>No chats yet</Text>
            </View>
        }
      />

      <FAB onPress={() => navigation.navigate('UserSelection', { currentUser })} />

      <CustomMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onRefresh={onRefresh} 
        onLogout={handleLogout} 
        onNewGroup={() => navigation.navigate('NewGroup', { currentUser })}
      />

      {loading && (
        <View style={styles.globalLoader}>
            <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  tabContainer: {
    flexDirection: 'row', backgroundColor: '#4A90E2', height: 50, alignItems: 'center',
  },
  cameraIcon: { width: '12%', alignItems: 'center', justifyContent: 'center' },
  tabItem: { width: '29.33%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#FFF' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
  emptyText: { color: '#64748B', fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  globalLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  }
});
