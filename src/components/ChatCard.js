import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatCard = memo(({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.chatCard}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={styles.avatarContainer}>
      <View style={[styles.avatar, item.isGroup ? styles.groupAvatar : null]}>
        {item.isGroup ? (
          <Ionicons name="people" size={30} color="#FFF" />
        ) : (
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      {!item.isGroup && item.isOnline && <View style={styles.onlineBadge} />}
    </View>
    
    <View style={styles.chatInfo}>
      <View style={styles.chatHeader}>
        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.timeText, item.unreadCount > 0 ? styles.unreadTimeText : null]}>
          {item.lastMessageTime}
        </Text>
      </View>
      <View style={styles.chatFooter}>
        <View style={styles.lastMsgContainer}>
          {item.lastMessageType === 'image' && <Ionicons name="camera" size={16} color="#666" style={{ marginRight: 4 }} />}
          {item.lastMessageType === 'video' && <Ionicons name="videocam" size={16} color="#666" style={{ marginRight: 4 }} />}
          {item.lastMessageType === 'audio' && <Ionicons name="mic" size={16} color="#666" style={{ marginRight: 4 }} />}
          {item.lastMessageType === 'document' && <Ionicons name="document" size={16} color="#666" style={{ marginRight: 4 }} />}
          
          <Text style={[styles.lastMessage, item.unreadCount > 0 ? styles.unreadMessageText : null]} numberOfLines={1}>
            {item.lastMessage || (item.lastMessageType === 'image' ? 'Photo' : item.lastMessageType === 'video' ? 'Video' : item.lastMessageType === 'audio' ? 'Voice Message' : item.lastMessageType === 'document' ? 'Document' : '')}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  chatCard: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  avatarContainer: { marginRight: 15 },
  avatar: {
    width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: '#4A90E2',
  },
  onlineBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#FFF',
  },
  avatarText: { color: '#4A90E2', fontSize: 22, fontWeight: 'bold' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 17, fontWeight: 'bold', color: '#000', maxWidth: '65%' },
  timeText: { fontSize: 12, color: '#666' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  lastMsgContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lastMessage: { fontSize: 14, color: '#666', flex: 1 },
  unreadMessageText: { color: '#000', fontWeight: '600' },
  unreadTimeText: { color: '#4A90E2', fontWeight: '700' },
  badgeContainer: {
    backgroundColor: '#4A90E2', minWidth: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 10,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
});

export default ChatCard;
