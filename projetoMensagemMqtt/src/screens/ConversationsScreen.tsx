import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
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
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    conversationRepository
      .findAll()
      .then((items) => { if (mounted) setConversations(items); })
      .catch(() => { if (mounted) setError('Falha ao carregar conversas.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleCreate = async (input: { name: string; topic: string }) => {
    setError(null);
    try {
      const conversation = await conversationRepository.create(input);
      setConversations((prev) => [conversation, ...prev]);
      onConversationCreated(conversation);
      setModalVisible(false);
    } catch (err: any) {
      if (err?.code === 'TOPIC_ALREADY_EXISTS')
        setError('Tópico já existe. Escolha outro.');
      else
        setError(err?.message ?? 'Falha ao criar conversa.');
    }
  };

  const handleLongPress = (conversation: Conversation) => {
    Alert.alert(
      conversation.name,
      'Selecione uma ação',
      [
        {
          text: '✏️  Renomear',
          onPress: () => {
            setSelectedConversation(conversation);
            setRenameText(conversation.name);
            setRenameModalVisible(true);
          },
        },
        {
          text: '🗑  Excluir',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Excluir conversa',
              `Deseja excluir "${conversation.name}" e todo o histórico?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Excluir',
                  style: 'destructive',
                  onPress: async () => {
                    await conversationRepository.delete(conversation.id);
                    setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
                    onConversationDeleted(conversation.topic);
                  },
                },
              ],
            ),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const handleRenamePress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setRenameText(conversation.name);
    setRenameModalVisible(true);
  };

  const handleRenameConfirm = async () => {
    if (!selectedConversation) return;
    const trimmed = renameText.trim();
    if (!trimmed) { Alert.alert('Atenção', 'O nome não pode ser vazio.'); return; }
    try {
      const updated = await conversationRepository.rename(selectedConversation.id, trimmed);
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setRenameModalVisible(false);
      setSelectedConversation(null);
      setRenameText('');
    } catch (err: any) {
      Alert.alert('Erro ao renomear', err?.message ?? 'Falha ao renomear.');
    }
  };

  const handleRenameCancel = () => {
    setRenameModalVisible(false);
    setSelectedConversation(null);
    setRenameText('');
  };

  return (
    <View style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Conversas</Text>
          <Text style={styles.subtitle}>
            {conversations.length === 0 ? 'Nenhuma conversa ainda' : `${conversations.length} conversa${conversations.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={onOpenSettings}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Abrir ajustes"
        >
          <Text style={styles.settingsBtnText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <StatusIndicator status={status} />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      {/* Lista */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Carregando…</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Sem conversas</Text>
          <Text style={styles.emptyHint}>Toque em "+ Nova" para começar.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => onOpenChat(item)}
              onLongPress={() => handleLongPress(item)}
              onRenamePress={() => handleRenamePress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Nova conversa"
      >
        <Text style={styles.fabText}>Nova Conversa</Text>
      </TouchableOpacity>

      {/* Modal renomear */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleRenameCancel}
      >
        <View style={styles.renameOverlay}>
          <View style={styles.renameSheet}>
            <Text style={styles.renameTitle}>Renomear conversa</Text>
            <TextInput
              style={styles.renameInput}
              placeholder="Novo nome"
              placeholderTextColor="#475569"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              accessible
              accessibilityLabel="Novo nome da conversa"
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={[styles.renameBtn, styles.renameBtnCancel]}
                onPress={handleRenameCancel}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Cancelar renomeação"
              >
                <Text style={styles.renameBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameBtn, styles.renameBtnConfirm]}
                onPress={handleRenameConfirm}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Confirmar novo nome"
              >
                <Text style={styles.renameBtnConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NewConversationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2e788171', padding: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsBtnText: { fontSize: 23 },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#64748b' },

  list: { paddingBottom: 100 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: '#0b7525',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 999,
    shadowColor: '#0b7525',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  renameSheet: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  renameTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9', marginBottom: 16 },
  renameInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 13,
    color: '#f1f5f9',
    fontSize: 15,
    marginBottom: 20,
  },
  renameActions: { flexDirection: 'row', gap: 12 },
  renameBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  renameBtnCancel: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  renameBtnCancelText: { color: '#94a3b8', fontWeight: '700' },
  renameBtnConfirm: { backgroundColor: '#0b7525' },
  renameBtnConfirmText: { color: '#fff', fontWeight: '700' },
});