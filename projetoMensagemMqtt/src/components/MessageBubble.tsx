import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isSent = message.direction === 'sent';
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[styles.row, isSent ? styles.rowSent : styles.rowReceived]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        isSent
          ? `Você: ${message.body}, ${time}`
          : `${message.sender}: ${message.body}, ${time}`
      }
    >
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        {!isSent && (
          <Text style={styles.sender} numberOfLines={1}>
            {message.sender}
          </Text>
        )}
        <Text style={[styles.body, isSent && styles.bodySent]}>{message.body}</Text>
        <Text style={[styles.time, isSent && styles.timeSent]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 3,
    paddingHorizontal: 16,
  },
  rowSent: {
    alignItems: 'flex-end',
  },
  rowReceived: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleSent: {
    backgroundColor: '#0b7525',
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7dd3fc',
    marginBottom: 3,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: '#e2e8f0',
  },
  bodySent: {
    color: '#ffffff',
  },
  time: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'right',
  },
  timeSent: {
    color: 'rgba(255,255,255,0.6)',
  },
});