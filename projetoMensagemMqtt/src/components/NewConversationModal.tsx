import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreateConversationInput } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: CreateConversationInput) => Promise<void>;
}

export function NewConversationModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setTopic('');
      setError(null);
      setCreating(false);
    }
  }, [visible]);

  const validate = () => {
    if (!name.trim()) {
      return 'Nome é obrigatório.';
    }
    if (!topic.trim()) {
      return 'Tópico é obrigatório.';
    }
    if (/\s/.test(topic)) {
      return 'Tópico não pode conter espaços.';
    }
    if (/[#+]/.test(topic)) {
      return 'Tópico não pode conter # ou +.';
    }

    return null;
  };

  const handleCreate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await onCreate({ name: name.trim(), topic: topic.trim() });
      setName('');
      setTopic('');
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao criar conversa.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Nova conversa</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome da conversa"
            value={name}
            onChangeText={setName}
            editable={!creating}
          />
          <TextInput
            style={styles.input}
            placeholder="Tópico MQTT"
            value={topic}
            onChangeText={setTopic}
            editable={!creating}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={creating}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={styles.createText}>{creating ? 'Criando...' : 'Criar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#4b7bec',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  createText: {
    color: '#fff',
    fontWeight: '600',
  },
});
