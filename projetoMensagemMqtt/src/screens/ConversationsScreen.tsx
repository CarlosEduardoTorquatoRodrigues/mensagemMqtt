import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatusIndicator from '../components/StatusIndicator';
import ConversationItem from '../components/ConversationItem';
import NewConversationModal from '../components/NewConversationModal';
import { ConversationRepositoryImpl } from '../repositories/conversationRepository';
import { MessageRepositoryImpl } from '../repositories/messageRepository';
import { useMqtt } from '../hooks/useMqtt';

const convRepo = new ConversationRepositoryImpl();
const msgRepo = new MessageRepositoryImpl();

export default function ConversationsScreen({
  onOpenConversation,
  openSettings,
}: {
  onOpenConversation: (id: string) => void;
  openSettings: () => void;
}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const mqtt = useMqtt();

  useEffect(() => {
    let mounted = true;
    convRepo.findAll().then((list) => {
      if (mounted) setConversations(list);
    }).finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  async function createConversation(input: { name: string; topic: string; }) {
    try {
      const c = await convRepo.create(input);
      setConversations((s) => [c, ...s]);
      // subscribe ao novo tópico
      mqtt.subscribe(c.topic);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Erro ao criar conversa');
      throw e;
    }
  }

  function handleLongPress(conv: any) {
    Alert.alert('Confirmar', 'Excluir conversa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeConversation(conv) },
    ]);
  }

  async function removeConversation(conv: any) {
    await convRepo.delete(conv.id);
    await msgRepo.deleteByConversation(conv.id);
    mqtt.unsubscribe(conv.topic);
    setConversations((s) => s.filter((c) => c.id !== conv.id));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Conversas</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StatusIndicator status={mqtt.status} />
          <View style={{ width: 12 }} />
          <Button title="Ajustes" onPress={openSettings} />
        </View>
      </View>

      <Button title="Nova conversa" onPress={() => setModalVisible(true)} />

      {loading ? <Text>Carregando...</Text> : (
        conversations.length === 0 ? <Text>Nenhuma conversa</Text> : (
          <FlatList
            data={conversations}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <ConversationItem conversation={item} onPress={() => onOpenConversation(item.id)} onLongPress={handleLongPress} />
            )}
          />
        )
      )}

      <NewConversationModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={createConversation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
});
