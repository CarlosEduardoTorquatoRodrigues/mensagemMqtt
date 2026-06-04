import { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Conversation, CreateConversationInput, ConnectionStatus } from '../types';
import { ConversationItem } from '../components/ConversationItem';
import { NewConversationModal } from '../components/NewConversationModal';
import { StatusIndicator } from '../components/StatusIndicator';

interface Props {
  conversations: Conversation[];
  status: ConnectionStatus;
  onOpenSettings: () => void;
  onOpenConversation: (conversation: Conversation) => void;
  onCreateConversation: (input: CreateConversationInput) => Promise<Conversation>;
  onDeleteConversation: (conversation: Conversation) => Promise<void>;
}

export function ConversationsScreen({
  conversations,
  status,
  onOpenSettings,
  onOpenConversation,
  onCreateConversation,
  onDeleteConversation,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCreate = async (input: CreateConversationInput) => {
    await onCreateConversation(input);
  };

  const handleLongPress = (conversation: Conversation) => {
    Alert.alert(
      'Excluir conversa',
      `Deseja excluir ${conversation.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDeleteConversation(conversation),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversas</Text>
        <StatusIndicator status={status} />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.actionText}>Nova conversa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onOpenSettings}>
          <Text style={styles.actionText}>Ajustes</Text>
        </TouchableOpacity>
      </View>
      {conversations.length === 0 ? (
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
              onPress={() => onOpenConversation(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#616161',
    fontSize: 16,
  },
  list: {
    paddingBottom: 20,
  },
});
