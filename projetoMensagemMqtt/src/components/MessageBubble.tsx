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
    marginVertical: 2,
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
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bubbleSent: {
    backgroundColor: '#065f46',
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  bubbleReceived: {
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sender: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#d1d5db',
  },
  bodySent: {
    color: '#ecfdf5',
  },
  time: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'right',
  },
  timeSent: {
    color: 'rgba(167,243,208,0.6)',
  },
});