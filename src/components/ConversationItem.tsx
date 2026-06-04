import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Conversation } from '../types';

interface Props {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
}

export function ConversationItem({ conversation, onPress, onLongPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View>
        <Text style={styles.name}>{conversation.name}</Text>
        <Text style={styles.topic}>{conversation.topic}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  topic: {
    marginTop: 4,
    color: '#616161',
  },
});
