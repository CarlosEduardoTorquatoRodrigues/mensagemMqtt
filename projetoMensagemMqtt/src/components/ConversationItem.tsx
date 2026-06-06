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
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Conversa ${conversation.name}, tópico ${conversation.topic}. Toque longo para opções.`}
      accessibilityHint="Toque para abrir. Toque longo para renomear ou excluir."
    >
      {/* Avatar */}
      <View style={styles.avatar}>
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
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  avatarText: {
    color: '#34d399',
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
    color: '#f9fafb',
    marginBottom: 4,
  },
  topic: {
    fontSize: 11,
    color: '#10b981',
    fontFamily: 'monospace',
    letterSpacing: 0.4,
    opacity: 0.8,
  },
  renameBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  renameBtnText: {
    fontSize: 14,
  },
});