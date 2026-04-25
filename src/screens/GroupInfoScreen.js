import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../config';

export default function GroupInfoScreen({ navigation, route }) {
  const { groupId, currentUser } = route.params;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupDetails();
  }, []);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}`);
      const data = await res.json();
      setGroup(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const currentUserId = currentUser?._id || currentUser?.id;
  const isAdmin = group?.admin === currentUserId;

  const handleEditName = () => {
    Alert.prompt(
      "Edit Group Name",
      "Enter new group name",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "OK", 
          onPress: async (newName) => {
            if (!newName) return;
            try {
              const res = await fetch(`${BASE_URL}/api/groups/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId, name: newName, adminId: currentUserId })
              });
              const data = await res.json();
              setGroup(data);
            } catch (err) {
              Alert.alert("Error", "Failed to update group");
            }
          }
        }
      ],
      'plain-text',
      group?.name
    );
  };

  const handleAddUser = () => {
    navigation.navigate('NewGroup', { 
        currentUser,
        isAddingMore: true,
        groupId,
        existingMembers: group?.members || []
    });
  };

  const handleRemoveUser = (userId, userName) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${userName} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/groups/removeMember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId, userId, adminId: currentUserId })
              });
              const data = await res.json();
              setGroup(data);
            } catch (err) {
              Alert.alert("Error", "Failed to remove member");
            }
          }
        }
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Exit Group",
      "Are you sure you want to exit this group?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Exit", 
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/api/groups/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId, userId: currentUserId })
              });
              navigation.navigate('ChatList');
            } catch (err) {
              Alert.alert("Error", "Failed to leave group");
            }
          }
        }
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "This action is permanent and will delete all messages. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/api/groups/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId, adminId: currentUserId })
              });
              navigation.navigate('ChatList');
            } catch (err) {
              Alert.alert("Error", "Failed to delete group");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Text style={styles.profileInitials}>{group?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.groupName}>{group?.name}</Text>
          <Text style={styles.groupSubText}>Group · {group?.members?.length} participants</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionItem} onPress={handleEditName}>
            <Ionicons name="pencil" size={20} color="#4A90E2" />
            <Text style={styles.actionText}>Edit Group Name</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.actionItem} onPress={handleAddUser}>
              <Ionicons name="person-add" size={20} color="#4A90E2" />
              <Text style={styles.actionText}>Add Participants</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>{group?.members?.length} Participants</Text>
          {group?.members?.map((member) => (
            <View key={member._id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}{member._id === currentUserId ? " (You)" : ""}</Text>
                {group.admin === member._id && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Group Admin</Text>
                  </View>
                )}
              </View>
              {isAdmin && member._id !== currentUserId && (
                <TouchableOpacity onPress={() => handleRemoveUser(member._id, member.name)}>
                  <Ionicons name="remove-circle-outline" size={24} color="#E63946" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleLeaveGroup}>
            <Ionicons name="log-out-outline" size={24} color="#E63946" />
            <Text style={styles.dangerText}>Exit Group</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteGroup}>
              <Ionicons name="trash-outline" size={24} color="#E63946" />
              <Text style={styles.dangerText}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    height: 60, 
    backgroundColor: '#4A90E2', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15 
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  profileSection: { 
    alignItems: 'center', 
    paddingVertical: 30, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  imageContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#4A90E2', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  profileInitials: { fontSize: 40, fontWeight: 'bold', color: '#FFF' },
  groupName: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  groupSubText: { fontSize: 14, color: '#64748B', marginTop: 5 },
  actionSection: { 
    backgroundColor: '#FFF', 
    marginTop: 15, 
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0'
  },
  actionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  actionText: { fontSize: 16, color: '#4A90E2', marginLeft: 15 },
  membersSection: { 
    backgroundColor: '#FFF', 
    marginTop: 15, 
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0'
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginVertical: 15 },
  memberItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  memberAvatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: '#CBD5E1', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
  memberInfo: { flex: 1, marginLeft: 15 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  adminBadge: { 
    backgroundColor: '#DCF8C6', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    alignSelf: 'flex-start',
    marginTop: 4
  },
  adminBadgeText: { fontSize: 10, color: '#075E54', fontWeight: 'bold' },
  dangerSection: { 
    backgroundColor: '#FFF', 
    marginTop: 15, 
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0'
  },
  dangerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15 
  },
  dangerText: { fontSize: 16, color: '#E63946', marginLeft: 15 }
});
