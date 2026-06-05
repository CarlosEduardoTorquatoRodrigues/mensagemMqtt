import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Conversation } from '../types';

interface Props {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
  onRenamePress: () => void;
}

export function ConversationItem({ conversation, onPress, onLongPress, onRenamePress }: Props) {
  const initials = conversation.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Conversa ${conversation.name}, tópico ${conversation.topic}. Toque longo para opções.`}
      accessibilityHint="Toque para abrir. Toque longo para renomear ou excluir."
    >
      {/* Avatar */}
      <View style={styles.avatar} aria-hidden>
        <Text style={styles.avatarText}>{initials || '?'}</Text>
      </View>

      {/* Textos */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{conversation.name}</Text>
        <Text style={styles.topic} numberOfLines={1}>{conversation.topic}</Text>
      </View>

      {/* Botão renomear */}
      <TouchableOpacity
        style={styles.renameBtn}
        onPress={onRenamePress}
        activeOpacity={0.7}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Renomear conversa ${conversation.name}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.renameBtnText}>✏️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65661d',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 3,
  },
  topic: {
    fontSize: 12,
    color: '#8feb18',
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  renameBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e2dada',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  renameBtnText: {
    fontSize: 15,
  },
});