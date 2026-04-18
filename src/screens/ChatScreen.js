import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { BASE_URL } from '../config'; 

export default function ChatScreen({ route }) {
  const { username, currentUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // 1. Fetch historical chat messages from Backend DB
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/messages`);
        const data = await res.json();
        // Since it's global for now, push all
        setMessages(data);
      } catch (err) {
        console.error("Historical messages error: ", err);
      }
    };
    fetchHistory();

    // 2. Setup Socket event bindings
    const newSocket = io(BASE_URL);
    setSocket(newSocket);
    newSocket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    return () => newSocket.disconnect();
  }, []);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: currentUser,
        time: timeString
      };
      setMessages((prev) => [...prev, newMessage]);
      if (socket) socket.emit('sendMessage', newMessage);
      setInputText('');
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === currentUser;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        {!isMe && (
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{item.sender.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.messageWrapper}>
          <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
            <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>{item.text}</Text>
          </View>
          <Text style={styles.timeText}>{item.time || 'now'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <FlatList 
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id?.toString() || item.id?.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        <View style={styles.inputSection}>
          <TextInput 
            style={styles.inputBox}
            placeholder="Type your message..."
            placeholderTextColor="#8e8e8e"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive]} 
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            {/* Added Ionicons for clean paper-plane Send Icon */}
            <Ionicons 
              name={inputText.trim() ? "send" : "send-outline"} 
              size={20} 
              color={inputText.trim() ? "#FFFFFF" : "#94A3B8"} 
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 30 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  avatarMini: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarMiniText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  messageWrapper: { maxWidth: '75%' },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  myBubble: { backgroundColor: '#4A90E2', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  messageText: { fontSize: 16, lineHeight: 22 },
  myText: { color: '#FFFFFF' },
  theirText: { color: '#1E293B' },
  timeText: { fontSize: 11, color: '#94A3B8', marginTop: 4, alignSelf: 'flex-end', paddingHorizontal: 4 },
  inputSection: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F1F5F9', alignItems: 'flex-end' },
  inputBox: { flex: 1, backgroundColor: '#F1F5F9', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, minHeight: 48, maxHeight: 120, borderRadius: 24, fontSize: 16, marginRight: 12, color: '#1E293B' },
  sendBtn: { height: 48, width: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sendBtnActive: { backgroundColor: '#4A90E2', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  sendBtnInactive: { backgroundColor: '#E2E8F0' },
  sendIcon: { marginLeft: 2 } // tiny offset for paper plane centering
});
