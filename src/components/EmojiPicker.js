import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
];

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 8;
const EMOJI_SIZE = width / COLUMN_COUNT;

const EmojiPicker = ({ onEmojiSelected, isVisible }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={EMOJI_LIST}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.emojiItem} 
            onPress={() => onEmojiSelected(item)}
          >
            <Text style={styles.emojiText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    backgroundColor: '#F7F7F7',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  listContent: {
    paddingVertical: 10,
  },
  emojiItem: {
    width: EMOJI_SIZE,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
});

export default EmojiPicker;
