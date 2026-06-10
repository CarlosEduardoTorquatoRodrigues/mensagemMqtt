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
            {conversations.length === 0
              ? 'Nenhuma conversa ainda'
              : `${conversations.length} conversa${conversations.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={onOpenSettings}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Abrir ajustes"
        >
          <Text style={styles.settingsBtnText}>⚙️</Text>
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
          <ActivityIndicator color="#10b981" size="large" />
          <Text style={styles.loadingText}>Carregando…</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>💬</Text>
          </View>
          <Text style={styles.emptyTitle}>Sem conversas</Text>
          <Text style={styles.emptyHint}>Toque em "Nova Conversa" para começar.</Text>
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
              placeholderTextColor="#4b5563"
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
  container: { flex: 1, backgroundColor: '#31adb683', padding: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#f9fafb', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#ffffff', marginTop: 3 },
  settingsBtn: {
    width: 55,
    height: 55,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  settingsBtnText: { fontSize: 22 },

  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', marginTop: 14, fontSize: 14 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },

  list: { paddingBottom: 110 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 999,
    gap: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },

  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  renameSheet: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  renameTitle: { fontSize: 18, fontWeight: '800', color: '#f9fafb', marginBottom: 18 },
  renameInput: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    color: '#f9fafb',
    fontSize: 15,
    marginBottom: 22,
  },
  renameActions: { flexDirection: 'row', gap: 12 },
  renameBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  renameBtnCancel: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  renameBtnCancelText: { color: '#9ca3af', fontWeight: '700' },
  renameBtnConfirm: {
    backgroundColor: '#059669',
    shadowColor: '#10b981',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  renameBtnConfirmText: { color: '#fff', fontWeight: '700' },
});