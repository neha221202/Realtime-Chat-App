import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Text, Modal, TouchableOpacity, Image, Keyboard, Alert, ActionSheetIOS, Dimensions, Clipboard, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import io from 'socket.io-client';
import { BASE_URL } from '../config';

// Import Modular Components
import MessageItem from '../components/MessageItem';
import ChatInput from '../components/ChatInput';
import EmojiPicker from '../components/EmojiPicker';
import ChatMenu from '../components/ChatMenu';
import { formatLastSeen } from '../utils/dateUtils';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, Video, ResizeMode } from 'expo-av';

export default function ChatScreen({ route, navigation }) {
  const { username, receiverEmail, currentUser, receiverId, receiverStatus, receiverLastSeen, groupId, isGroup } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const [rStatus, setRStatus] = useState({ isOnline: receiverStatus, lastSeen: receiverLastSeen });
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({}); // { tempId: progress }
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const previewSound = useRef(null);
  const recordingTimer = useRef(null);

  const flatListRef = useRef(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [groupDetails, setGroupDetails] = useState(null);

  useEffect(() => {
    if (isGroup && groupId) {
      fetch(`${BASE_URL}/api/groups/${groupId}`)
        .then(res => res.json())
        .then(data => setGroupDetails(data))
        .catch(err => console.error(err));
    }
  }, [isGroup, groupId]);

  const handleLeaveGroup = async () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Leave", 
        style: "destructive", 
        onPress: async () => {
          try {
            await fetch(`${BASE_URL}/api/groups/leave`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ groupId, userId: currentUser._id })
            });
            navigation.navigate('ChatList');
          } catch (err) {
            Alert.alert("Error", "Failed to leave group");
          }
        }
      }
    ]);
  };

  const handleDeleteGroup = async () => {
    Alert.alert("Delete Group", "Are you sure? This will delete all messages and remove all members.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await fetch(`${BASE_URL}/api/groups/delete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ groupId, adminId: currentUser._id })
            });
            navigation.navigate('ChatList');
          } catch (err) {
            Alert.alert("Error", "Failed to delete group");
          }
        }
      }
    ]);
  };

  const handleEditGroup = () => {
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
                body: JSON.stringify({ groupId, name: newName, adminId: currentUser._id })
              });
              const data = await res.json();
              setGroupDetails(data);
            } catch (err) {
              Alert.alert("Error", "Failed to update group");
            }
          }
        }
      ],
      'plain-text',
      groupDetails?.name
    );
  };

  const handleAddParticipants = () => {
    navigation.navigate('NewGroup', { 
        currentUser,
        isAddingMore: true,
        groupId,
        existingMembers: groupDetails?.members || []
    });
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          onPress={() => isGroup && navigation.navigate('GroupInfo', { groupId, currentUser })}
          style={{ marginLeft: -15 }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>{username}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            {isGroup ? 'Click for group info' : (rStatus.isOnline ? 'online' : `last seen ${formatLastSeen(rStatus.lastSeen)}`)}
          </Text>
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: '#4A90E2' },
      headerTintColor: '#FFF',
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 10 }}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
        </TouchableOpacity>
      )
    });
  }, [username, rStatus, isGroup]);

  useEffect(() => {
    global.activeChat = isGroup ? groupId : receiverEmail;
    const newSocket = io(BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (currentUser?._id) {
        newSocket.emit('registerUser', currentUser._id);
      }
    });

    if (!isGroup) {
      newSocket.on('statusUpdate', ({ userId, isOnline, lastSeen }) => {
        if (userId === receiverId) {
          setRStatus({ isOnline, lastSeen });
        }
      });
    }

  const fetchHistory = async () => {
      try {
        const url = isGroup 
          ? `${BASE_URL}/api/messages?groupId=${groupId}`
          : `${BASE_URL}/api/messages?sender=${currentUser.email}&receiver=${receiverEmail}`;
        const res = await fetch(url);
        const data = await res.json();
        setMessages(data);

        // Mark incoming messages as seen on load
        if (!isGroup) {
          data.forEach(msg => {
            if (msg.receiver === currentUser.email && msg.status !== 'seen') {
              newSocket.emit('messageRead', { messageId: msg._id, senderId: receiverId });
            }
          });
        } else {
          // Mark group as read
          fetch(`${BASE_URL}/api/groups/markAsRead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, userId: currentUser._id })
          });
        }
      } catch (err) {
        console.error("Fetch history error: ", err);
      }
    };
    fetchHistory();

    newSocket.on('receiveMessage', (message) => {
      const isRelevant = isGroup 
        ? message.groupId === groupId
        : (message.sender === receiverEmail || (message.sender === currentUser.email && message.receiver === receiverEmail));
      
      if (isRelevant) {
        setMessages((prev) => {
          // If I am the sender, I already have this message (or it's being updated via messageStatusUpdate)
          if (message.sender === currentUser.email) {
             // Just ensure we don't add it again if it already has an _id
             if (prev.find(m => m._id === message._id)) return prev;
             
             // If it's a group message and I'm the sender, the local 'sending' version 
             // will be replaced by 'messageStatusUpdate'. 
             // So we ONLY add if it's NOT already there and NOT a 'sending' version of itself.
             // Actually, for simplicity: If I'm the sender and it's a group, 
             // skip adding in receiveMessage because messageStatusUpdate handles it.
             if (isGroup) return prev;
          }

          // Avoid duplicate messages
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        if (!isGroup && message.sender === receiverEmail) {
          newSocket.emit('messageRead', { messageId: message._id, senderId: receiverId });
        } else if (isGroup && message.sender !== currentUser.email) {
          fetch(`${BASE_URL}/api/groups/markAsRead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, userId: currentUser._id })
          });
        }
      }
    });

    newSocket.on('reactionUpdated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    });

    newSocket.on('messageStatusUpdate', ({ tempId, message }) => {
      setMessages(prev => prev.map(m => m.id === tempId ? message : m));
    });

    newSocket.on('messageStatusChanged', ({ messageId, status }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
    });

    newSocket.on('messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('messageUpdated', ({ messageId, text }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, text, isEdited: true } : m));
    });

    return () => {
      global.activeChat = null;
      newSocket.disconnect();
    };
  }, [receiverEmail, currentUser, receiverId]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (editingMessage) {
      try {
        const res = await fetch(`${BASE_URL}/api/messages/${editingMessage._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText.trim() })
        });
        if (res.ok) {
          socket.emit('editMessage', { 
            messageId: editingMessage._id, 
            text: inputText.trim(), 
            receiverId 
          });
          setMessages(prev => prev.map(m => m._id === editingMessage._id ? { ...m, text: inputText.trim(), isEdited: true } : m));
          setEditingMessage(null);
          setInputText('');
          return;
        }
      } catch (err) {
        console.error("Edit message error:", err);
      }
    }

    const tempId = Date.now().toString();
    const messageData = {
      id: tempId,
      sender: currentUser.email,
      senderName: currentUser.name,
      receiver: isGroup ? null : receiverEmail,
      receiverId: isGroup ? null : receiverId,
      groupId: isGroup ? groupId : null,
      text: inputText.trim() || '',
      messageType: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyingTo ? { 
        text: replyingTo.text, 
        sender: replyingTo.sender,
        messageType: replyingTo.messageType,
        fileName: replyingTo.fileName
      } : null
    };

    if (socket) {
        socket.emit('sendMessage', messageData);
        setMessages(prev => [...prev, { ...messageData, status: 'sending' }]);
    }
    
    setInputText('');
    setReplyingTo(null);
  };

  const handleSwipe = (message) => {
    setReplyingTo({
      text: message.text,
      messageType: message.messageType,
      fileName: message.fileName,
      sender: message.sender === currentUser.email ? 'You' : username
    });
  };

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setReactionModalVisible(true);
  };

  const addReaction = (emoji) => {
    if (selectedMessage && socket) {
      socket.emit('addReaction', { 
        messageId: selectedMessage._id, 
        userId: currentUser.email, 
        emoji, 
        receiverId 
      });
    }
    setReactionModalVisible(false);
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
      Alert.alert("Success", "Message copied to clipboard");
    }
    setReactionModalVisible(false);
  };

  const handleDeleteMessage = () => {
    setReactionModalVisible(false);
    if (!selectedMessage?._id) return;

    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/messages/${selectedMessage._id}`, {
                method: 'DELETE'
              });
              if (res.ok) {
                socket.emit('deleteMessage', { 
                  messageId: selectedMessage._id, 
                  receiverId 
                });
                setMessages(prev => prev.filter(m => m._id !== selectedMessage._id));
              }
            } catch (err) {
              console.error("Delete message error:", err);
            }
          } 
        }
      ]
    );
  };

  const handleReplyAction = () => {
    if (selectedMessage) {
      handleSwipe(selectedMessage);
    }
    setReactionModalVisible(false);
  };

  const handleEditAction = () => {
    if (selectedMessage && selectedMessage.text) {
      setEditingMessage(selectedMessage);
      setInputText(selectedMessage.text);
      setReactionModalVisible(false);
      // Optional: focus input
    }
  };

  const handleClearChat = () => {
    setMenuVisible(false);
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/messages/clear?sender=${currentUser.email}&receiver=${receiverEmail}`, {
                method: 'DELETE'
              });
              if (res.ok) {
                setMessages([]);
              } else {
                Alert.alert("Error", "Could not clear chat.");
              }
            } catch (err) {
              console.error("Clear chat error:", err);
              Alert.alert("Error", "Network error.");
            }
          } 
        }
      ]
    );
  };

  const handlePickImage = async (useCamera = false, type = 'All') => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", `You need to allow access to your ${useCamera ? 'camera' : 'gallery'} to send files.`);
        return;
      }

      const mediaTypes = type === 'Images' 
        ? ImagePicker.MediaTypeOptions.Images 
        : type === 'Videos' 
          ? ImagePicker.MediaTypeOptions.Videos 
          : ImagePicker.MediaTypeOptions.All;

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ 
            mediaTypes, 
            quality: 0.7,
            allowsEditing: type === 'Images',
            videoMaxDuration: 60, // Limit video to 1 minute
          })
        : await ImagePicker.launchImageLibraryAsync({ 
            mediaTypes: ImagePicker.MediaTypeOptions.All, 
            quality: 0.7,
            allowsMultipleSelection: true,
            selectionLimit: 10
          });

      if (!result.canceled) {
        // Generate a unique groupId for this batch if multiple assets
        const batchGroupId = result.assets.length > 1 ? `batch-${Date.now()}` : null;
        
        // Handle assets
        for (const asset of result.assets) {
          await handleUploadAndSend(asset, batchGroupId);
        }
      }
    } catch (err) {
      console.error("Pick media error:", err);
      Alert.alert("Error", "Could not access camera or gallery.");
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert("Permission Required", "You need to allow microphone access to record audio.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    clearInterval(recordingTimer.current);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        setAudioPreview({
          uri,
          duration: recordingDuration,
          fileName: `Voice_${new Date().getTime()}.m4a`
        });
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSendAudioPreview = async () => {
    if (!audioPreview) return;
    const preview = audioPreview;
    setAudioPreview(null);
    await handleUploadAndSend({ 
      uri: preview.uri, 
      type: 'audio', 
      mimeType: 'audio/m4a', 
      fileName: preview.fileName 
    });
  };

  const handleCancelAudioPreview = async () => {
    if (previewSound.current) {
        await previewSound.current.unloadAsync();
        previewSound.current = null;
    }
    setIsPreviewPlaying(false);
    setAudioPreview(null);
  };

  const handleTogglePreviewPlayback = async () => {
    if (previewSound.current) {
      const status = await previewSound.current.getStatusAsync();
      if (status.isPlaying) {
        await previewSound.current.pauseAsync();
        setIsPreviewPlaying(false);
      } else {
        await previewSound.current.playAsync();
        setIsPreviewPlaying(true);
      }
    } else if (audioPreview) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioPreview.uri },
        { shouldPlay: true }
      );
      previewSound.current = sound;
      setIsPreviewPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPreviewPlaying(false);
        }
      });
    }
  };

  const handleCameraPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Record Video'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handlePickImage(true, 'Images');
          else if (buttonIndex === 2) handlePickImage(true, 'Videos');
        }
      );
    } else {
      Alert.alert(
        "Camera",
        "Choose an option",
        [
          { text: "Take Photo", onPress: () => handlePickImage(true, 'Images') },
          { text: "Record Video", onPress: () => handlePickImage(true, 'Videos') },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled) {
        await handleUploadAndSend(result.assets[0]);
      }
    } catch (err) {
      console.error("Pick document error:", err);
    }
  };

  const handleUploadAndSend = async (fileAsset, batchGroupId = null) => {
    const tempId = Date.now().toString();
    const filename = fileAsset.uri.split('/').pop();
    
    // 1. Add to UI immediately with local URI
    let mType = 'image';
    if (fileAsset.type === 'video' || fileAsset.mimeType?.startsWith('video')) mType = 'video';
    else if (fileAsset.type === 'audio' || fileAsset.mimeType?.startsWith('audio')) mType = 'audio';
    else if (fileAsset.type !== 'image' && !fileAsset.mimeType?.startsWith('image')) mType = 'document';

    const initialMsg = {
      id: tempId,
      sender: currentUser.email,
      senderName: currentUser.name,
      receiver: isGroup ? null : receiverEmail,
      receiverId: isGroup ? null : receiverId,
      groupId: isGroup ? groupId : null,
      batchGroupId: batchGroupId, // For multi-image grouping
      text: '',
      messageType: mType,
      localUri: fileAsset.uri, // Use local URI for instant preview
      fileName: fileAsset.fileName || filename,
      replyTo: replyingTo ? { 
        text: replyingTo.text, 
        sender: replyingTo.sender,
        messageType: replyingTo.messageType,
        fileName: replyingTo.fileName
      } : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setMessages(prev => [...prev, initialMsg]);
    setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));
    setReplyingTo(null); // Clear reply after starting upload

    try {
      // 2. Prepare FormData
      const formData = new FormData();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `${mType}/${match[1]}` : mType;

      formData.append('file', {
        uri: fileAsset.uri,
        name: filename || 'upload',
        type: fileAsset.mimeType || type,
      });

      // 3. Upload using XMLHttpRequest for progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/api/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const data = JSON.parse(xhr.response);
          
          // 4. Send via Socket once upload is done
          const finalMessage = {
            ...initialMsg,
            fileUrl: data.fileUrl,
            fileName: data.fileName || filename,
            localUri: null // Clear local URI
          };
          delete finalMessage.status; // status will be set by socket logic

          socket.emit('sendMessage', finalMessage);
          
          // Clear progress
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[tempId];
              return newProgress;
            });
          }, 500);
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Network error');
      };

      xhr.send(formData);

    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Could not send file.");
      // Remove failed message or mark as error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleAttachPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Photo & Video Library', 'Document'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handlePickImage(false);
          else if (buttonIndex === 2) handlePickDocument();
        }
      );
    } else {
      // For Android, show a simple Alert as a menu for now
      Alert.alert(
        "Attach",
        "Choose an option",
        [
          { text: "Photo & Video", onPress: () => handlePickImage(false) },
          { text: "Document", onPress: () => handlePickDocument() },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handleMediaPress = (media, index = 0, images = null) => {
    if (media.messageType === 'document') {
      const url = media.localUri || `${BASE_URL}${media.fileUrl}`;
      Linking.openURL(url).catch(err => {
        Alert.alert("Error", "Could not open document");
        console.error("Failed to open URL:", err);
      });
      return;
    }

    if (images) {
      setPreviewMedia({ images, initialIndex: index, messageType: 'image' });
    } else {
      setPreviewMedia({ ...media, initialIndex: 0, images: [media] });
    }
  };

  const handleEmojiSelected = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
        setShowEmojiPicker(false);
    } else {
        Keyboard.dismiss();
        setShowEmojiPicker(true);
    }
  };

  // Close emoji picker when keyboard shows up
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setShowEmojiPicker(false);
    });
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const groupedMessages = useMemo(() => {
    const grouped = [];
    let currentImageGroup = null;

    messages.forEach((msg) => {
      const isImage = msg.messageType === 'image';
      
      if (isImage && msg.groupId) {
        // Only group if it's the same sender and same groupId
        if (currentImageGroup && currentImageGroup.sender === msg.sender && currentImageGroup.groupId === msg.groupId) {
          currentImageGroup.images.push(msg);
        } else {
          currentImageGroup = {
            ...msg,
            type: 'image-group',
            images: [msg]
          };
          grouped.push(currentImageGroup);
        }
      } else {
        currentImageGroup = null;
        grouped.push(msg);
      }
    });
    return grouped;
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          renderItem={({ item }) => (
            <MessageItem 
                item={item} 
                isMe={item.sender === currentUser.email} 
                onSwipe={handleSwipe}
                onLongPress={handleLongPress}
                onMediaPress={handleMediaPress}
                uploadProgress={uploadProgress[item.id]}
            />
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <ChatInput 
          inputText={inputText}
          setInputText={setInputText}
          onSendMessage={handleSendMessage}
          insets={insets}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onEmojiPress={() => setShowEmojiPicker(!showEmojiPicker)}
          isEmojiPickerVisible={showEmojiPicker}
          onAttachPress={handleAttachPress}
          onCameraPress={handleCameraPress}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          audioPreview={audioPreview}
          onSendAudioPreview={handleSendAudioPreview}
          onCancelAudioPreview={handleCancelAudioPreview}
          isPreviewPlaying={isPreviewPlaying}
          onTogglePreviewPlayback={handleTogglePreviewPlayback}
          editingMessage={editingMessage}
          onCancelEdit={() => { setEditingMessage(null); setInputText(''); }}
        />

        <EmojiPicker 
            isVisible={showEmojiPicker} 
            onEmojiSelected={handleEmojiSelected} 
        />

        <ChatMenu 
          visible={menuVisible} 
          onClose={() => setMenuVisible(false)} 
          onClearChat={handleClearChat} 
        />

        <Modal
          visible={reactionModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReactionModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setReactionModalVisible(false)}
          >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <View style={styles.actionMenuContainer}>
                  {/* Reactions at Top */}
                  <View style={styles.reactionMenu}>
                    {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji) => (
                      <TouchableOpacity key={emoji} onPress={() => addReaction(emoji)} style={styles.emojiItem}>
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Selected Message Preview in Middle */}
                  <View style={styles.messagePreviewWrapper}>
                    <MessageItem 
                      item={selectedMessage} 
                      isMe={selectedMessage?.sender === currentUser.email} 
                      onMediaPress={() => {}}
                      onLongPress={() => {}}
                      uploadProgress={undefined}
                      onSwipe={() => {}}
                      isModalPreview={true}
                    />
                  </View>

                  {/* Options at Bottom */}
                  <View style={styles.optionsMenu}>
                    <TouchableOpacity style={styles.optionItem} onPress={handleReplyAction}>
                      <Text style={styles.optionText}>Reply</Text>
                      <Ionicons name="arrow-undo-outline" size={20} color="#000" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionItem} onPress={() => { setReactionModalVisible(false); Alert.alert("Forward", "Coming soon!"); }}>
                      <Text style={styles.optionText}>Forward</Text>
                      <Ionicons name="arrow-redo-outline" size={20} color="#000" />
                    </TouchableOpacity>

                    {selectedMessage?.text && (
                      <TouchableOpacity style={styles.optionItem} onPress={handleCopyMessage}>
                        <Text style={styles.optionText}>Copy</Text>
                        <Ionicons name="copy-outline" size={20} color="#000" />
                      </TouchableOpacity>
                    )}

                    {selectedMessage?.sender === currentUser.email && selectedMessage?.messageType === 'text' && (
                      <TouchableOpacity style={styles.optionItem} onPress={handleEditAction}>
                        <Text style={styles.optionText}>Edit</Text>
                        <Ionicons name="create-outline" size={20} color="#000" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.optionItem} onPress={() => { setReactionModalVisible(false); Alert.alert("Star", "Coming soon!"); }}>
                      <Text style={styles.optionText}>Star</Text>
                      <Ionicons name="star-outline" size={20} color="#000" />
                    </TouchableOpacity>

                    {selectedMessage?.sender === currentUser.email && (
                      <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} onPress={handleDeleteMessage}>
                        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Delete</Text>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Modal>

        {/* Media Preview Modal */}
        <Modal
          visible={!!previewMedia}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewMedia(null)}
        >
          <View style={styles.previewOverlay}>
            <TouchableOpacity 
              style={styles.closePreview} 
              onPress={() => setPreviewMedia(null)}
            >
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>

            {previewMedia?.images && previewMedia.messageType === 'image' ? (
              <FlatList
                data={previewMedia.images}
                horizontal
                pagingEnabled
                initialScrollIndex={previewMedia.initialIndex}
                getItemLayout={(data, index) => ({
                  length: styles.fullImage.width,
                  offset: styles.fullImage.width * index,
                  index,
                })}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                  <View style={{ width: styles.previewOverlay.width || 400, justifyContent: 'center' }}>
                    <Image 
                      source={{ uri: item.localUri || `${BASE_URL}${item.fileUrl}` }} 
                      style={styles.fullImage} 
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
            ) : previewMedia?.messageType === 'video' ? (
              <Video
                source={{ uri: previewMedia.localUri || `${BASE_URL}${previewMedia.fileUrl}` }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
                style={styles.fullVideo}
              />
            ) : previewMedia?.messageType === 'audio' ? (
              <View style={styles.documentPreview}>
                <Ionicons name="musical-notes" size={80} color="#FFF" />
                <Text style={styles.previewFileName}>{previewMedia.fileName}</Text>
                <Video
                  source={{ uri: previewMedia.localUri || `${BASE_URL}${previewMedia.fileUrl}` }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  useNativeControls
                  style={{ width: '80%', height: 80, marginTop: 20, backgroundColor: '#333', borderRadius: 10 }}
                />
              </View>
            ) : previewMedia?.messageType === 'document' && (
              <View style={styles.documentPreview}>
                <Ionicons name="document-text" size={80} color="#FFF" />
                <Text style={styles.previewFileName}>{previewMedia.fileName}</Text>
                <Text style={styles.previewSubText}>File preview not available.</Text>
              </View>
            )}
          </View>
        </Modal>
        <ChatMenu 
          visible={menuVisible} 
          onClose={() => setMenuVisible(false)} 
          onClearChat={() => { setMenuVisible(false); Alert.alert("Clear", "Coming soon!"); }}
          isGroup={isGroup}
          isAdmin={groupDetails?.admin === currentUser?._id || groupDetails?.admin === currentUser?.id}
          onLeaveGroup={() => { setMenuVisible(false); handleLeaveGroup(); }}
          onDeleteGroup={() => { setMenuVisible(false); handleDeleteGroup(); }}
          onEditGroup={() => { setMenuVisible(false); handleEditGroup(); }}
          onAddParticipants={() => { setMenuVisible(false); handleAddParticipants(); }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E5DDD5' },
  container: { flex: 1 },
  listContent: { padding: 10, paddingBottom: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionMenu: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emojiItem: { padding: 8 },
  emojiText: { fontSize: 24 },

  actionMenuContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagePreviewWrapper: {
    width: '100%',
    marginVertical: 10,
    // Add a slight scale to make it "pop"
    transform: [{ scale: 1.02 }],
  },
  optionsMenu: {
    backgroundColor: 'rgba(255,255,255,0.9)', // Slightly transparent
    borderRadius: 12,
    width: 250,
    marginTop: 5,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    alignSelf: 'center', // Centered like the user requested
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },

  // Preview Styles
  previewOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', width: Dimensions.get('window').width },
  closePreview: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: Dimensions.get('window').width, height: '80%' },
  fullVideo: { width: '100%', height: '80%' },
  documentPreview: { alignItems: 'center', padding: 20 },
  previewFileName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  previewSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 10, textAlign: 'center' },
});
