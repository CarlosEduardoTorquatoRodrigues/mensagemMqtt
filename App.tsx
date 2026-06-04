import './src/polyfills';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConversationsScreen } from './src/screens/ConversationsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { settingsRepository } from './src/repositories/settingsRepository';
import { conversationRepository } from './src/repositories/conversationRepository';
import { messageRepository } from './src/repositories/messageRepository';
import { useMqtt } from './src/hooks/useMqtt';
import { ConnectionStatus, Conversation, CreateConversationInput, Settings } from './src/types';

type ScreenName = 'settings' | 'conversations' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('settings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [suppressUntil, setSuppressUntil] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const savedSettings = await settingsRepository.get();
      const allConversations = await conversationRepository.findAll();
      setSettings(savedSettings);
      setConversations(allConversations);
      setScreen(savedSettings ? 'conversations' : 'settings');
      setLoading(false);
    };

    load();
  }, []);

  const handleReceivedMessage = useCallback(
    (message: { conversationId: string }) => {
      // Ignora mensagens recebidas durante janela de supressão (ex.: limpeza)
      if (Date.now() < suppressUntil) return;
      if (selectedConversation?.id === message.conversationId) {
        setRefreshKey((prev) => prev + 1);
      }
    },
    [selectedConversation, suppressUntil]
  );

  const mqtt = useMqtt(settings, conversations.map((item) => item.topic), handleReceivedMessage);

  const handleSaveSettings = async (input: Partial<Omit<Settings, 'clientId'>>) => {
    const saved = await settingsRepository.save(input);
    setSettings(saved);
    setScreen('conversations');
    return saved;
  };

  const submitSettings = async (input: Partial<Omit<Settings, 'clientId'>>) => {
    await handleSaveSettings(input);
  };

  const handleCreateConversation = async (input: CreateConversationInput) => {
    const conversation = await conversationRepository.create(input);
    setConversations((prev) => [conversation, ...prev]);
    mqtt.subscribe(conversation.topic);
    return conversation;
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    await conversationRepository.delete(conversation.id);
    await messageRepository.deleteByConversation(conversation.id);
    mqtt.unsubscribe(conversation.topic);
    setConversations((prev) => prev.filter((item) => item.id !== conversation.id));
    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation(null);
      setScreen('conversations');
    }
  };

  const handleOpenConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setScreen('chat');
  };

  const handleSendMessage = async (conversation: Conversation, body: string) => {
    if (!settings) {
      throw new Error('Nenhum usuário configurado.');
    }
    return mqtt.sendMessage(conversation, body, settings.nickname);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {screen === 'settings' ? (
        <SettingsScreen
          settings={settings}
          status={mqtt.status}
          onSave={submitSettings}
          onBack={settings ? () => setScreen('conversations') : undefined}
        />
      ) : screen === 'conversations' ? (
        <ConversationsScreen
          conversations={conversations}
          status={mqtt.status}
          onOpenSettings={() => setScreen('settings')}
          onOpenConversation={handleOpenConversation}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      ) : selectedConversation ? (
        <ChatScreen
          conversation={selectedConversation}
          status={mqtt.status}
          onBack={() => setScreen('conversations')}
          onSendMessage={handleSendMessage}
          refreshKey={refreshKey}
          onClearComplete={() => setSuppressUntil(Date.now() + 5000)}
        />
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
