import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isSent = message.direction === 'sent';

  return (
    <View
      style={[
        styles.container,
        isSent ? styles.sentContainer : styles.receivedContainer,
      ]}
    >
      {!isSent && <Text style={styles.sender}>{message.sender}</Text>}
      <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
        <Text style={[styles.body, !isSent && styles.receivedBody]}>{message.body}</Text>
        <Text style={[styles.timestamp, !isSent && styles.receivedTimestamp]}>{new Date(message.createdAt).toLocaleTimeString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  sentBubble: {
    backgroundColor: '#1976d2',
  },
  receivedBubble: {
    backgroundColor: '#e0e0e0',
  },
  body: {
    color: '#fff',
    fontSize: 16,
  },
  receivedBody: {
    color: '#1f1f1f',
  },
  sender: {
    marginBottom: 4,
    color: '#424242',
    fontWeight: '700',
  },
  timestamp: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'right',
  },
  receivedTimestamp: {
    color: 'rgba(0,0,0,0.6)',
  },
});
