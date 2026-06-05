import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Conversation } from '../types';

interface Props {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
}

export function ConversationItem({ conversation, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View>
        <Text style={styles.name}>{conversation.name}</Text>
        <Text style={styles.topic}>{conversation.topic}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  topic: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});
