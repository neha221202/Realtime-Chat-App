import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../config';

export default function GroupInfoScreen({ navigation, route }) {
  const { currentUser, participants } = route.params;
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Required", "Please enter a group name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim(),
          adminId: currentUser._id,
          memberIds: participants.map(p => p._id)
        })
      });

      if (res.ok) {
        const group = await res.json();
        // Redirect to Chat screen for this group
        navigation.navigate('Chat', { 
            username: group.name, 
            currentUser: currentUser, 
            groupId: group._id,
            isGroup: true
        });
      } else {
        throw new Error('Failed to create group');
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity style={styles.avatarCircle}>
              <Ionicons name="camera" size={32} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type group subject here..."
              value={groupName}
              onChangeText={setGroupName}
              maxLength={25}
            />
            <Text style={styles.charCount}>{25 - groupName.length}</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Group description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.participantsHeader}>
              <Text style={styles.participantsTitle}>Participants: {participants.length}</Text>
          </View>

          <View style={styles.participantsList}>
              {participants.map((p, idx) => (
                  <View key={p._id} style={styles.participantItem}>
                      <View style={styles.pAvatar}>
                          <Text style={styles.pAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.pName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                  </View>
              ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreateGroup}
        disabled={loading}
      >
        {loading ? (
            <ActivityIndicator color="#FFF" />
        ) : (
            <Ionicons name="checkmark" size={32} color="#FFF" />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    height: 60, 
    backgroundColor: '#4A90E2', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginLeft: 20 },
  content: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: { flex: 1, height: 50, fontSize: 16 },
  charCount: { color: '#64748B', fontSize: 12 },
  participantsHeader: { marginBottom: 15 },
  participantsTitle: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap' },
  participantItem: { width: 60, alignItems: 'center', marginRight: 15, marginBottom: 15 },
  pAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5
  },
  pAvatarText: { color: '#FFF', fontWeight: 'bold' },
  pName: { fontSize: 12, color: '#1E293B' },
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
  }
});
