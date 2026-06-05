import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isSent = message.direction === 'sent';

  return (
    <View style={[styles.container, isSent ? styles.sentContainer : styles.receivedContainer]}>
      {!isSent && <Text style={styles.sender}>{message.sender}</Text>}
      <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
        <Text style={styles.body}>{message.body}</Text>
        <Text style={styles.timestamp}>{new Date(message.createdAt).toLocaleTimeString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  sender: {
    color: '#555',
    fontSize: 12,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 10,
  },
  sentBubble: {
    backgroundColor: '#4b7bec',
  },
  receivedBubble: {
    backgroundColor: '#ecf0f1',
  },
  body: {
    color: '#111',
    fontSize: 15,
  },
  timestamp: {
    marginTop: 6,
    fontSize: 10,
    color: '#555',
    textAlign: 'right',
  },
});
