import './src/polyfills';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import ConversationsScreen from './src/screens/ConversationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useMqtt } from './src/hooks/useMqtt';
import { conversationRepository } from './src/repositories/conversationRepository';
import { messageRepository } from './src/repositories/messageRepository';
import { settingsRepository } from './src/repositories/settingsRepository';
import { Conversation, Settings } from './src/types';

type Screen = 'settings' | 'conversations' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('settings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIncomingMessage = useCallback(
    async (topic: string, payload: { clientId: string; sender: string; body: string; sentAt: string }) => {
      const conversation = await conversationRepository.findByTopic(topic);
      if (!conversation) return;
      await messageRepository.create({
        conversationId: conversation.id,
        sender: payload.sender,
        body: payload.body,
        direction: 'received',
      });
      if (selectedConversation?.id === conversation.id) {
        setRefreshKey((prev) => prev + 1);
      }
    },
    [selectedConversation?.id],
  );

  const mqtt = useMqtt(settings, topics, handleIncomingMessage);

  useEffect(() => {
    let mounted = true;
    settingsRepository.get().then((saved) => {
      if (!mounted) return;
      if (saved) { setSettings(saved); setScreen('conversations'); }
      else setScreen('settings');
    }).finally(() => { if (mounted) setLoadingSettings(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!settings) { setTopics([]); return; }
    let mounted = true;
    conversationRepository.findAll().then((conversations) => {
      if (mounted) setTopics(conversations.map((c) => c.topic));
    });
    return () => { mounted = false; };
  }, [settings?.clientId]);

  const handleSaveSettings = async (input: Partial<Omit<Settings, 'clientId'>>) => {
    const saved = await settingsRepository.save(input);
    setSettings(saved);
    setScreen('conversations');
    return saved;
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setTopics((prev) => [...prev, conversation.topic]);
    setSelectedConversation(conversation);
    setScreen('chat');
  };

  const handleConversationDeleted = (topic: string) => {
    setTopics((prev) => prev.filter((t) => t !== topic));
    if (selectedConversation?.topic === topic) {
      setSelectedConversation(null);
      setScreen('conversations');
    }
  };

  if (loadingSettings) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {screen === 'settings' ? (
          <SettingsScreen
            settings={settings}
            status={mqtt.status}
            onSave={handleSaveSettings}
            onBack={settings ? () => setScreen('conversations') : undefined}
          />
        ) : screen === 'conversations' ? (
          <ConversationsScreen
            status={mqtt.status}
            onOpenSettings={() => setScreen('settings')}
            onOpenChat={(c) => { setSelectedConversation(c); setScreen('chat'); }}
            onConversationCreated={handleConversationCreated}
            onConversationDeleted={handleConversationDeleted}
          />
        ) : selectedConversation && settings ? (
          <ChatScreen
            conversation={selectedConversation}
            settings={settings}
            status={mqtt.status}
            sendMessage={mqtt.sendMessage}
            onBack={() => setScreen('conversations')}
            refreshKey={refreshKey}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});