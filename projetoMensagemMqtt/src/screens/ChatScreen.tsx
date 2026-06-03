import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MessageRepositoryImpl } from '../repositories/messageRepository';
import { SettingsRepositoryImpl } from '../repositories/settingsRepository';
import MessageBubble from '../components/MessageBubble';
import { useMqtt } from '../hooks/useMqtt';
import { MqttPayload } from '../types';

const msgRepo = new MessageRepositoryImpl();
const settingsRepo = new SettingsRepositoryImpl();

export default function ChatScreen({ conversationId, topic, onBack }: { conversationId: string; topic: string; onBack: () => void; }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const mqtt = useMqtt();
  const listRef = useRef<FlatList<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    msgRepo.findByConversation(conversationId).then((m) => { if (mounted) setMessages(m); });

    const dispose = mqtt.addMessageListener((t, payload: MqttPayload) => {
      if (t !== topic) return;
      setMessages((s) => [...s, {
        id: `${Date.now()}`, conversationId, sender: payload.sender, body: payload.body, direction: 'received', createdAt: payload.sentAt,
      }]);
    });

    return () => { mounted = false; dispose(); };
  }, [conversationId, topic]);

  useEffect(() => {
    // scroll to end whenever messages change
    setTimeout(() => listRef.current?.scrollToEnd?.(), 200);
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const settings = await settingsRepo.get();
    if (!settings) return;

    const payload: MqttPayload = { clientId: settings.clientId, sender: settings.nickname, body: input.trim(), sentAt: new Date().toISOString() };
    // persist
    await msgRepo.create({ conversationId, sender: settings.nickname, body: payload.body, direction: 'sent' });
    setMessages((s) => [...s, { id: `${Date.now()}`, conversationId, sender: settings.nickname, body: payload.body, direction: 'sent', createdAt: payload.sentAt }]);
    setInput('');
    mqtt.sendMessage(topic, payload);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}><Text>Voltar</Text></TouchableOpacity>
        <FlatList ref={listRef} data={messages} keyExtractor={(i) => i.id} renderItem={({ item }) => <MessageBubble message={item} />} keyboardShouldPersistTaps="handled" />

        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Digite sua mensagem" />
          <TouchableOpacity onPress={send} style={styles.sendButton}><Text style={{ color: '#fff' }}>Enviar</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: 8 },
  inputRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 8, marginRight: 8 },
  sendButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4 },
});
