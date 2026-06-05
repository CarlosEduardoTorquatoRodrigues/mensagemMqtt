import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Conversation } from '../types';
import { ConversationItem } from '../components/ConversationItem';
import { NewConversationModal } from '../components/NewConversationModal';
import { StatusIndicator } from '../components/StatusIndicator';
import { conversationRepository } from '../repositories/conversationRepository';

interface Props {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  onOpenSettings: () => void;
  onOpenChat: (conversation: Conversation) => void;
  onConversationCreated: (conversation: Conversation) => void;
  onConversationDeleted: (topic: string) => void;
}

export default function ConversationsScreen({
  status,
  onOpenSettings,
  onOpenChat,
  onConversationCreated,
  onConversationDeleted,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    conversationRepository
      .findAll()
      .then((items) => {
        if (mounted) {
          setConversations(items);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Falha ao carregar conversas.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async (input: { name: string; topic: string }) => {
    setError(null);

    try {
      const conversation = await conversationRepository.create(input);
      setConversations((prev) => [conversation, ...prev]);
      onConversationCreated(conversation);
      setModalVisible(false);
    } catch (err: any) {
      if (err?.code === 'TOPIC_ALREADY_EXISTS') {
        setError('Tópico já existe. Escolha outro tópico.');
      } else {
        setError(err?.message ?? 'Falha ao criar conversa.');
      }
    }
  };

  const handleDelete = (conversation: Conversation) => {
    Alert.alert(
      'Excluir conversa',
      'Tem certeza que deseja excluir esta conversa e seu histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await conversationRepository.delete(conversation.id);
            setConversations((prev) => prev.filter((item) => item.id !== conversation.id));
            onConversationDeleted(conversation.topic);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Conversas</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsText}>Ajustes</Text>
        </TouchableOpacity>
      </View>
      <StatusIndicator status={status} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma conversa encontrada.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => onOpenChat(item)}
              onLongPress={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Nova conversa</Text>
      </TouchableOpacity>
      <NewConversationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
  },
  settingsText: {
    fontWeight: '700',
    color: '#333',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 10,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#555',
  },
  list: {
    paddingBottom: 120,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: '#4b7bec',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
