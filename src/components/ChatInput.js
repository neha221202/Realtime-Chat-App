import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const ChatInput = ({ inputText, setInputText, onSendMessage, insets, replyingTo, onCancelReply, onEmojiPress, isEmojiPickerVisible, onAttachPress, onCameraPress, isRecording, recordingDuration, onStartRecording, onStopRecording, audioPreview, onSendAudioPreview, onCancelAudioPreview, isPreviewPlaying, onTogglePreviewPlayback, editingMessage, onCancelEdit }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 6), paddingHorizontal: 6 }}>
      
      {/* Reply Preview Header */}
        {editingMessage && (
          <View style={styles.replyContainer}>
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={styles.replyName}>Editing Message</Text>
              <Text style={styles.replyText} numberOfLines={1}>{editingMessage.text}</Text>
            </View>
            <TouchableOpacity onPress={onCancelEdit} style={styles.closeReply}>
              <Ionicons name="close-circle" size={20} color="#85959f" />
            </TouchableOpacity>
          </View>
        )}
      {replyingTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={styles.replyName}>{replyingTo.sender === 'Me' ? 'You' : replyingTo.sender}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {replyingTo.messageType === 'image' && <Ionicons name="camera" size={14} color="#666" style={{ marginRight: 4 }} />}
              {replyingTo.messageType === 'video' && <Ionicons name="videocam" size={14} color="#666" style={{ marginRight: 4 }} />}
              {replyingTo.messageType === 'audio' && <Ionicons name="mic" size={14} color="#666" style={{ marginRight: 4 }} />}
              {replyingTo.messageType === 'document' && <Ionicons name="document" size={14} color="#666" style={{ marginRight: 4 }} />}
              
              <Text style={styles.replyText} numberOfLines={1}>
                {replyingTo.text || (replyingTo.messageType === 'image' ? 'Photo' : replyingTo.messageType === 'video' ? 'Video' : replyingTo.messageType === 'audio' ? 'Voice Message' : replyingTo.messageType === 'document' ? (replyingTo.fileName || 'Document') : '')}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.closeReply}>
            <Ionicons name="close-circle" size={20} color="#85959f" />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputContainer, replyingTo ? styles.inputWithReply : null]}>
        <View style={styles.inputWrapper}>
          {audioPreview ? (
            <View style={styles.recordingRow}>
              <TouchableOpacity onPress={onCancelAudioPreview} style={{ marginRight: 10 }}>
                <Ionicons name="trash" size={22} color="#FF3B30" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onTogglePreviewPlayback} style={{ marginRight: 10 }}>
                <Ionicons name={isPreviewPlaying ? "pause" : "play"} size={22} color="#4A90E2" />
              </TouchableOpacity>
              <Text style={styles.recordingText}>Voice Message ({formatDuration(audioPreview.duration)})</Text>
            </View>
          ) : isRecording ? (
            <View style={styles.recordingRow}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording {formatDuration(recordingDuration)}</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={onEmojiPress}>
                <MaterialIcons 
                  name={isEmojiPickerVisible ? "keyboard" : "insert-emoticon"} 
                  size={24} 
                  color="#85959f" 
                />
              </TouchableOpacity>
              
              <TextInput 
                style={styles.inputBox}
                placeholder="Message"
                placeholderTextColor="#85959f"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              
              <TouchableOpacity style={styles.iconBtn} onPress={onAttachPress}>
                <Ionicons name="attach" size={24} color="#85959f" style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
              
              {inputText.length === 0 && (
                <TouchableOpacity style={styles.iconBtn} onPress={onCameraPress}>
                  <Ionicons name="camera" size={24} color="#85959f" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.sendBtn, (isRecording && !audioPreview) ? styles.stopBtn : null]} 
          onPress={audioPreview ? onSendAudioPreview : (inputText.trim() ? onSendMessage : (isRecording ? onStopRecording : onStartRecording))} 
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name={(inputText.trim() || audioPreview) ? "send" : (isRecording ? "stop" : "microphone")} 
            size={22} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  replyPreview: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
    marginBottom: -1, // Connect with input wrapper
  },
  replyBar: { width: 4, backgroundColor: '#4A90E2', height: '100%', borderRadius: 2 },
  replyContent: { flex: 1, marginLeft: 10 },
  replyName: { fontWeight: 'bold', color: '#4A90E2', fontSize: 13 },
  replyText: { color: '#666', fontSize: 12 },
  closeReply: { padding: 4 },

  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  inputWithReply: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  inputWrapper: {
    flex: 1, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25,
    marginRight: 6, alignItems: 'center', paddingHorizontal: 8, minHeight: 48,
    elevation: 2,
  },
  inputBox: { flex: 1, fontSize: 17, color: '#000', paddingVertical: 8, paddingHorizontal: 5, maxHeight: 100 },
  iconBtn: { padding: 6 },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#4A90E2',
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  stopBtn: {
    backgroundColor: '#FF3B30',
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 10,
  },
  recordingText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ChatInput;
