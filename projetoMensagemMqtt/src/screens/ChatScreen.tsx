import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Message, MqttPayload, Settings, Conversation } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { StatusIndicator } from '../components/StatusIndicator';
import { messageRepository } from '../repositories/messageRepository';

interface Props {
  conversation: Conversation;
  settings: Settings;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  sendMessage: (topic: string, payload: MqttPayload) => void;
  onBack: () => void;
  refreshKey: number;
}

export default function ChatScreen({
  conversation,
  settings,
  status,
  sendMessage,
  onBack,
  refreshKey,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const stored = await messageRepository.findByConversation(conversation.id);
      setMessages(stored);
    } catch {
      setError('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, [conversation.id, refreshKey]);

  useEffect(() => {
    if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleClearConfirmed = async () => {
    setConfirmClearVisible(false);
    setError(null);
    setMessages([]);
    try {
      await messageRepository.deleteByConversation(conversation.id);
      await loadMessages();
    } catch {
      setError('Não foi possível limpar o histórico.');
    }
  };

  const handleSend = async () => {
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) { setError('Digite uma mensagem antes de enviar.'); return; }

    const message = await messageRepository.create({
      conversationId: conversation.id,
      sender: settings.nickname,
      body: trimmed,
      direction: 'sent',
    });
    setMessages((prev) => [...prev, message]);
    setBody('');
    sendMessage(conversation.topic, {
      clientId: settings.clientId,
      sender: settings.nickname,
      body: trimmed,
      sentAt: new Date().toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <View style={styles.container}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Voltar para lista de conversas"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{conversation.name}</Text>
            <Text style={styles.headerTopic} numberOfLines={1}>{conversation.topic}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setConfirmClearVisible(true)}
            style={styles.clearBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Limpar histórico de mensagens"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearBtnText}>X</Text>
          </TouchableOpacity>
        </View>

        <StatusIndicator status={status} />

        {/* Banner de confirmação de limpeza */}
        {confirmClearVisible ? (
          <View style={styles.confirmBanner}>
            <Text style={styles.confirmText}>
              Apagar todas as mensagens? A conversa será mantida.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => setConfirmClearVisible(false)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Cancelar limpeza"
              >
                <Text style={styles.confirmBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnDelete]}
                onPress={handleClearConfirmed}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Confirmar limpeza do histórico"
              >
                <Text style={styles.confirmBtnDeleteText}>Apagar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Mensagens */}
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Carregando mensagens…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyTitle}>Sem mensagens</Text>
            <Text style={styles.emptyHint}>Seja o primeiro a escrever!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Erro */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* Input de envio */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem…"
            placeholderTextColor="#475569"
            value={body}
            onChangeText={setBody}
            editable={!loading}
            multiline
            accessible
            accessibilityLabel="Campo de mensagem"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !body.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#2e788171' },
  container: { flex: 1, paddingTop: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: { color: '#0b7525', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  headerCenter: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#f1f5f9' },
  headerTopic: { fontSize: 11, color: '#8feb18', fontFamily: 'monospace', marginTop: 1 },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearBtnText: { fontSize: 18 },

  confirmBanner: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  confirmText: { color: '#cbd5e1', fontSize: 13, marginBottom: 12, lineHeight: 19 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnCancel: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  confirmBtnCancelText: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  confirmBtnDelete: { backgroundColor: '#ef4444' },
  confirmBtnDeleteText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', fontSize: 14 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#64748b' },

  list: { paddingTop: 8, paddingBottom: 16 },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#f1f5f9',
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0b7525',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b7525',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  sendBtnDisabled: { backgroundColor: '#1e293b', shadowOpacity: 0, elevation: 0 },
  sendBtnText: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26 },
});