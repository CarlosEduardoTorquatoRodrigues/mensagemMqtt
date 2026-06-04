import { useEffect, useRef, useState } from 'react';
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
import { messageRepository } from '../repositories/messageRepository';
import { Conversation, Message, ConnectionStatus } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { StatusIndicator } from '../components/StatusIndicator';

interface Props {
  conversation: Conversation;
  status: ConnectionStatus;
  onBack: () => void;
  onSendMessage: (conversation: Conversation, body: string) => Promise<Message>;
  refreshKey: number;
}

export function ChatScreen({
  conversation,
  status,
  onBack,
  onSendMessage,
  refreshKey,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const loadMessages = async () => {
    setLoading(true);
    const loaded = await messageRepository.findByConversation(conversation.id);
    setMessages(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [conversation.id, refreshKey]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Digite uma mensagem antes de enviar.');
      return;
    }

    setError(null);
    try {
      const sent = await onSendMessage(conversation, trimmed);
      setMessages((prev) => [...prev, sent]);
      setBody('');
    } catch {
      setError('Não foi possível enviar a mensagem.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{conversation.name}</Text>
          <StatusIndicator status={status} />
        </View>
      </View>
      <View style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando mensagens...</Text>
        ) : messages.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma mensagem nesta conversa.</Text>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={body}
          placeholder="Digite sua mensagem"
          onChangeText={setBody}
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backText: {
    color: '#1976d2',
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    color: '#616161',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyText: {
    color: '#616161',
    textAlign: 'center',
    marginTop: 24,
  },
  messages: {
    paddingBottom: 12,
  },
  inputArea: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    padding: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 12,
    backgroundColor: '#1976d2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: '#c62828',
    marginTop: 8,
  },
});
