import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Conversation } from '../types';

interface Props {
  conversation: Conversation;
  onPress?: (c: Conversation) => void;
  onLongPress?: (c: Conversation) => void;
}

export default function ConversationItem({ conversation, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress?.(conversation)}
      onLongPress={() => onLongPress?.(conversation)}
      style={styles.container}
    >
      <View>
        <Text style={styles.title}>{conversation.name}</Text>
        <Text style={styles.topic}>{conversation.topic}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  topic: { fontSize: 12, color: '#666' },
});
