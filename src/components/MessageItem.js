import React, { memo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio, Video } from 'expo-av';
import { BASE_URL } from '../config';

const isSingleEmoji = (text) => {
  if (!text) return false;
  // This regex matches a single emoji. It covers most common emojis.
  const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])$/u;
  return emojiRegex.test(text.trim());
};

const MessageItem = memo(({ item, isMe, onSwipe, onLongPress, onMediaPress, uploadProgress, isModalPreview }) => {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const isEdited = item.isEdited;
  const isDeleted = item.isDeleted;
  const reactions = item.reactions || [];

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handleAudioPlay = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const audioUrl = item.localUri || `${BASE_URL}${item.fileUrl}`;
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only trigger if swiping right and moving horizontally
        return gesture.dx > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0) {
          // Smoothly limit swipe distance
          const value = Math.min(gesture.dx, 70);
          swipeAnim.setValue(value);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 50) {
          onSwipe(item);
        }
        // Ultra smooth snap back for iOS
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20
        }).start();
      },
    })
  ).current;

  const renderStatusIcon = (status) => {
    if (status === 'sending') return <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255,255,255,0.7)" />;
    if (status === 'sent') return <MaterialCommunityIcons name="check" size={14} color="rgba(255,255,255,0.7)" />;
    if (status === 'delivered') return <MaterialCommunityIcons name="check-all" size={14} color="rgba(255,255,255,0.7)" />;
    if (status === 'seen') return <MaterialCommunityIcons name="check-all" size={14} color="#34B7F1" />;
    return null;
  };

  const iconOpacity = swipeAnim.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const iconScale = swipeAnim.interpolate({
    inputRange: [0, 50],
    outputRange: [0.5, 1.2],
    extrapolate: 'clamp',
  });

  const renderImageGrid = () => {
    const images = item.images || [item];
    const count = images.length;

    if (count === 1) {
      const img = images[0];
      return (
        <TouchableOpacity 
          onPress={() => onMediaPress(img)} 
          onLongPress={() => onLongPress(item)}
          activeOpacity={0.9} 
          style={styles.mediaWrapper}
        >
          <Image 
            source={{ uri: img.localUri || `${BASE_URL}${img.fileUrl}` }} 
            style={styles.mediaImage} 
            resizeMode="cover"
          />
          {uploadProgress !== undefined && uploadProgress < 100 && (
            <View style={styles.loaderOverlay}>
              <View style={styles.loaderCircle}>
                <Text style={styles.loaderText}>{uploadProgress}%</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Grid layout for 2, 3, 4+ images
    const gridStyle = count === 2 ? styles.grid2 : count === 3 ? styles.grid3 : styles.grid4;
    
    return (
      <View style={[styles.gridBase, gridStyle]}>
        {images.slice(0, 4).map((img, idx) => (
          <TouchableOpacity 
            key={img.id || idx} 
            onPress={() => onMediaPress(img)} 
            onLongPress={() => onLongPress(item)}
            style={[styles.gridItem, count === 3 && idx === 0 ? styles.gridItemLarge : null]}
          >
            <Image 
              source={{ uri: img.localUri || `${BASE_URL}${img.fileUrl}` }} 
              style={styles.gridImage} 
              resizeMode="cover"
            />
            {count > 4 && idx === 3 && (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreText}>+{count - 3}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (item.messageType === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageBubble}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.messageRow, 
      isMe ? styles.myRow : styles.theirRow,
      item.reactions && item.reactions.length > 0 ? { marginBottom: 16 } : null
    ]}>
      
      {/* Animated Reply Icon Background */}
      <Animated.View style={[
        styles.swipeIconContainer, 
        { 
          opacity: iconOpacity,
          transform: [{ scale: iconScale }]
        }
      ]}>
        <Ionicons name="arrow-undo-circle" size={26} color="#4A90E2" />
      </Animated.View>

      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.bubbleContainer,
          { transform: [{ translateX: swipeAnim }] }
        ]}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onLongPress={() => onLongPress(item)}
          style={[
            styles.bubble, 
            isMe ? styles.myBubble : styles.theirBubble,
            isModalPreview && { alignSelf: 'center' },
            (item.messageType === 'image' || item.type === 'image-group') ? styles.mediaBubble : null
          ]}
        >
          {item.groupId && (
            <Text style={[styles.senderNameText, isMe ? styles.mySenderNameText : null]}>
              {isMe ? 'You' : (item.senderName || 'Unknown')}
            </Text>
          )}

          {item.replyTo && (
            <View style={styles.replyPreviewInside}>
              <View style={[styles.replyBar, { backgroundColor: isMe ? '#FFF' : '#4A90E2' }]} />
              <View style={styles.replyContent}>
                <Text style={[styles.replySender, { color: isMe ? '#FFF' : '#4A90E2' }]}>{item.replyTo.sender}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.replyTo.messageType === 'image' && <Ionicons name="camera" size={12} color={isMe ? '#FFF' : '#666'} style={{ marginRight: 4 }} />}
                  {item.replyTo.messageType === 'video' && <Ionicons name="videocam" size={12} color={isMe ? '#FFF' : '#666'} style={{ marginRight: 4 }} />}
                  {item.replyTo.messageType === 'audio' && <Ionicons name="mic" size={12} color={isMe ? '#FFF' : '#666'} style={{ marginRight: 4 }} />}
                  {item.replyTo.messageType === 'document' && <Ionicons name="document" size={12} color={isMe ? '#FFF' : '#666'} style={{ marginRight: 4 }} />}
                  
                  <Text style={[styles.replyText, { color: isMe ? 'rgba(255,255,255,0.8)' : '#666' }]} numberOfLines={1}>
                    {item.replyTo.text || (item.replyTo.messageType === 'image' ? 'Photo' : item.replyTo.messageType === 'video' ? 'Video' : item.replyTo.messageType === 'audio' ? 'Voice Message' : item.replyTo.messageType === 'document' ? (item.replyTo.fileName || 'Document') : '')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {(item.messageType === 'image' || item.type === 'image-group') && (
            <View style={styles.gridContainer}>
              {renderImageGrid()}
            </View>
          )}

          {item.messageType === 'audio' ? (
            <View style={styles.audioPlayerBubble}>
              <TouchableOpacity onPress={handleAudioPlay} style={styles.playButton}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={28} color={isMe ? '#FFF' : '#4A90E2'} />
              </TouchableOpacity>
              <View style={styles.audioControlRight}>
                <View style={styles.progressBarContainer}>
                   <View style={[styles.progressBar, { 
                     width: duration ? `${(position / duration) * 100}%` : '0%',
                     backgroundColor: isMe ? '#FFF' : '#4A90E2'
                   }]} />
                </View>
                <View style={styles.audioInfo}>
                  <Text style={[styles.audioTime, { color: isMe ? 'rgba(255,255,255,0.8)' : '#666' }]}>
                    {formatTime(position)} / {formatTime(duration)}
                  </Text>
                  <Ionicons name="mic" size={14} color={isMe ? 'rgba(255,255,255,0.8)' : '#666'} />
                </View>
              </View>
            </View>
          ) : item.messageType === 'video' ? (
            <TouchableOpacity 
              onPress={() => onMediaPress(item)} 
              onLongPress={() => onLongPress(item)}
              activeOpacity={0.9} 
              style={styles.videoPreviewContainer}
            >
              <Video
                source={{ uri: item.localUri || `${BASE_URL}${item.fileUrl}` }}
                style={styles.videoThumbnail}
                resizeMode="cover"
                shouldPlay={false}
                useNativeControls={false}
              />
              <View style={styles.videoPlayOverlay}>
                <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.8)" />
              </View>
              {uploadProgress !== undefined && uploadProgress < 100 && (
                <View style={styles.loaderOverlay}>
                  <View style={styles.loaderCircle}>
                    <Text style={styles.loaderText}>{uploadProgress}%</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ) : item.messageType === 'document' && (
            <TouchableOpacity 
              onPress={() => onMediaPress(item)} 
              onLongPress={() => onLongPress(item)}
              activeOpacity={0.8} 
              style={styles.documentBubble}
            >
              <View style={styles.documentInfo}>
                <View style={styles.pdfIconWrapper}>
                  <Ionicons name="document-text" size={32} color="#FF3B30" />
                  <Text style={styles.pdfBadgeText}>PDF</Text>
                </View>
                <View style={styles.documentTextContent}>
                  <Text style={[styles.fileName, { color: isMe ? '#FFF' : '#000' }]} numberOfLines={1}>
                    {item.fileName || 'Document.pdf'}
                  </Text>
                  <Text style={[styles.fileSize, { color: isMe ? 'rgba(255,255,255,0.7)' : '#666' }]}>
                    {item.fileSize || '1.2 MB'} • PDF
                  </Text>
                </View>
                <Ionicons name="download-outline" size={20} color={isMe ? '#FFF' : '#4A90E2'} />
              </View>
              {uploadProgress !== undefined && uploadProgress < 100 && (
                <View style={styles.documentLoader}>
                   <View style={[styles.documentProgress, { width: `${uploadProgress}%` }]} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {item.text ? (
            <Text style={[
              styles.messageText, 
              isMe ? styles.myText : styles.theirText,
              isSingleEmoji(item.text) ? styles.bigEmoji : null
            ]}>
              {item.text}
            </Text>
          ) : null}
          
          <View style={[
            styles.timeContainer,
            (item.messageType === 'image' || item.type === 'image-group') ? styles.mediaTimeContainer : null
          ]}>
            <Text style={[
              styles.timeText, 
              isMe ? styles.myTime : styles.theirTime,
              (item.messageType === 'image' || item.type === 'image-group') ? styles.mediaTimeText : null
            ]}>{item.time || '12:00 PM'}</Text>
            {isMe && <View style={{ marginLeft: 4 }}>{renderStatusIcon(item.status)}</View>}
          </View>

          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>
                {Array.from(new Set(item.reactions.map(r => r.emoji))).join('')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});


const styles = StyleSheet.create({
  messageRow: { 
    flexDirection: 'row', 
    marginBottom: 4, 
    width: '100%', 
    paddingHorizontal: 10, 
    alignItems: 'center',
    overflow: 'visible'
  },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  
  swipeIconContainer: {
    position: 'absolute',
    left: -10, // Adjusted for better iOS visibility during swipe
    height: '100%',
    justifyContent: 'center',
    width: 40,
    alignItems: 'center',
    zIndex: -1,
  },

  bubbleContainer: { maxWidth: '85%' },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  senderNameText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E67E22', // WhatsApp-like orange for sender names
    marginBottom: 2,
  },
  mySenderNameText: {
    color: '#E0F2FE', // Light blue/white for 'You' on blue background
  },
  myBubble: { backgroundColor: '#4A90E2', borderTopRightRadius: 2 },
  theirBubble: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 2 },
  
  replyPreviewInside: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 5,
  },
  replyBar: { width: 3, borderRadius: 2 },
  replyContent: { marginLeft: 8, flex: 1 },
  replySender: { fontWeight: 'bold', fontSize: 12 },
  replyText: { fontSize: 12, color: '#666' },

  messageText: { fontSize: 16, lineHeight: 21 },
  bigEmoji: { fontSize: 45, lineHeight: 55, textAlign: 'center' },
  myText: { color: '#FFFFFF' },
  theirText: { color: '#000' },
  timeContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  timeText: { fontSize: 11 },
  editedText: { fontSize: 10, fontStyle: 'italic' },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: '#85959f' },

  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  systemMessageBubble: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '90%',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  reactionBadge: {
    position: 'absolute',
    bottom: -12,
    right: 5,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  reactionEmoji: { fontSize: 12 },

  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 5,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    minWidth: 150,
  },
  fileName: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  
  mediaWrapper: { position: 'relative' },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loaderCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loaderText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  fileIconWrapper: { position: 'relative', width: 30, alignItems: 'center' },
  smallLoaderOverlay: {
    position: 'absolute',
    top: -5,
    right: -15,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  smallLoaderText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  // Grid Styles
  gridContainer: { marginBottom: 0 },
  gridBase: { flexDirection: 'row', flexWrap: 'wrap', width: 260, borderRadius: 10, overflow: 'hidden' },
  grid2: { height: 130 },
  grid3: { height: 260 },
  grid4: { height: 260 },
  gridItem: { width: '50%', height: '50%', padding: 1 },
  gridItemLarge: { width: '100%', height: '50%' }, // For 3 images, top one is large
  gridImage: { width: '100%', height: '100%' },

  mediaBubble: { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },
  mediaTimeContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaTimeText: { color: '#FFF' },
  
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

  // Audio Player Styles
  audioPlayerBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 200,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioControlRight: {
    flex: 1,
    marginLeft: 10,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  audioInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  audioTime: {
    fontSize: 10,
  },
  
  // Video Preview Styles
  videoPreviewContainer: {
    width: 240,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  
  // Document Styles
  documentBubble: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    minWidth: 220,
    marginBottom: 5,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pdfBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: -8,
  },
  documentTextContent: {
    flex: 1,
    marginRight: 10,
  },
  fileSize: {
    fontSize: 10,
    marginTop: 2,
  },
  documentLoader: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    borderRadius: 1,
    overflow: 'hidden',
  },
  documentProgress: {
    height: '100%',
    backgroundColor: '#4A90E2',
  }
});

export default MessageItem;
