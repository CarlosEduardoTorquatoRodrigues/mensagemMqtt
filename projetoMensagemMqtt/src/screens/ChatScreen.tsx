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

  const handleClear = () => {
    setConfirmClearVisible(true);
  };

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

  useEffect(() => {
    loadMessages();
  }, [conversation.id, refreshKey]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Digite uma mensagem antes de enviar.');
      return;
    }

    const message: Message = await messageRepository.create({
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{conversation.name}</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        </View>
        <StatusIndicator status={status} />
        {confirmClearVisible ? (
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmText}>
              Apagar todas as mensagens desta conversa? A conversa será mantida.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                onPress={() => setConfirmClearVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearConfirmed}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Apagar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {loading ? (
          <Text style={styles.loadingText}>Carregando mensagens...</Text>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem"
            value={body}
            onChangeText={setBody}
            editable={!loading}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backText: {
    color: '#4b7bec',
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  placeholder: {
    width: 64,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 24,
    color: '#555',
  },
  list: {
    paddingBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4b7bec',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: '#e74c3c',
    marginTop: 10,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearText: {
    color: '#e74c3c',
    fontWeight: '700',
  },
  confirmContainer: {
    backgroundColor: '#fff9f8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    marginBottom: 10,
  },
  confirmText: {
    color: '#333',
    marginBottom: 12,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
  },
  cancelText: {
    color: '#333',
    fontWeight: '700',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#e74c3c',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
