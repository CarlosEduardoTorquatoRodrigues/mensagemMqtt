import './src/polyfills';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import SettingsScreen from './src/screens/SettingsScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import { SettingsRepositoryImpl } from './src/repositories/settingsRepository';

type Screen = 'settings' | 'conversations' | { chat: string; topic: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>('conversations');
  const settingsRepo = new SettingsRepositoryImpl();

  useEffect(() => {
    settingsRepo.get().then((s) => {
      if (!s) setScreen('settings');
    });
  }, []);

  if (screen === 'settings') {
    return <SettingsScreen onSaved={() => setScreen('conversations')} />;
  }

  if (typeof screen === 'object' && screen.chat) {
    return <ChatScreen conversationId={screen.chat} topic={screen.topic} onBack={() => setScreen('conversations')} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ConversationsScreen onOpenConversation={(id) => {
        // find conversation to get topic
        // navigation: for simplicity, open chat with id and topic placeholder; repo will supply correct topic in real app
        setScreen({ chat: id, topic: '' });
      }} openSettings={() => setScreen('settings')} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

