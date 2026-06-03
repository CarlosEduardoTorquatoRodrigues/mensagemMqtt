import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isSent = message.direction === 'sent';

  return (
    <View style={[styles.container, isSent ? styles.sent : styles.received]}>
      {!isSent && <Text style={styles.sender}>{message.sender}</Text>}
      <View style={styles.bubble}>
        <Text>{message.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4, paddingHorizontal: 8 },
  sent: { alignSelf: 'flex-end' },
  received: { alignSelf: 'flex-start' },
  bubble: { backgroundColor: '#ecf0f1', padding: 8, borderRadius: 8, maxWidth: '80%' },
  sender: { fontSize: 12, color: '#555' },
});
