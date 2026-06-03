import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CreateConversationInput } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: CreateConversationInput) => Promise<void>;
}

export default function NewConversationModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');

  function validateTopic(t: string) {
    if (!t.trim()) return 'Tópico obrigatório';
    if (t.includes(' ') || t.includes('#') || t.includes('+')) return 'Tópico inválido';
    return '';
  }

  async function submit() {
    const err = validateTopic(topic);
    if (err) return Alert.alert('Aviso', err);

    try {
      await onCreate({ name: name || topic, topic });
      setName('');
      setTopic('');
      onClose();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Erro ao criar conversa');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <Text style={styles.label}>Tópico</Text>
          <TextInput value={topic} onChangeText={setTopic} style={styles.input} />
          <View style={styles.row}>
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} style={[styles.button, styles.primary]}>
              <Text style={{ color: '#fff' }}>Criar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8 },
  label: { fontSize: 12, color: '#333', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  button: { padding: 10, marginLeft: 8 },
  primary: { backgroundColor: '#007AFF', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10 },
});
