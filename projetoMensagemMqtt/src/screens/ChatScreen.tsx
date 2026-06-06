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
            <Text style={styles.clearBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <StatusIndicator status={status} />
        </View>

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
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>✉️</Text>
            </View>
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
            placeholderTextColor="#4b5563"
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
  flex: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { flex: 1, paddingTop: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  backBtnText: { color: '#10b981', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  headerCenter: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#f9fafb', letterSpacing: -0.2 },
  headerTopic: {
    fontSize: 11,
    color: '#10b981',
    fontFamily: 'monospace',
    marginTop: 2,
    opacity: 0.75,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  clearBtnText: { fontSize: 17 },

  statusRow: {
    paddingHorizontal: 16,
  },

  confirmBanner: {
    backgroundColor: '#111827',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    shadowColor: '#f87171',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  confirmText: { color: '#d1d5db', fontSize: 13, marginBottom: 14, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
  },
  confirmBtnCancel: { backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#1f2937' },
  confirmBtnCancelText: { color: '#9ca3af', fontWeight: '700', fontSize: 13 },
  confirmBtnDelete: {
    backgroundColor: '#dc2626',
    shadowColor: '#f87171',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  confirmBtnDeleteText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', fontSize: 14 },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#f9fafb', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: '#6b7280' },

  list: { paddingTop: 10, paddingBottom: 20 },

  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 11,
    padding: 11,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 18,
    borderTopWidth: 1,
    borderColor: '#111827',
    gap: 10,
    backgroundColor: '#0a0f1e',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#f9fafb',
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sendBtnDisabled: {
    backgroundColor: '#111827',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sendBtnText: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26 },
});