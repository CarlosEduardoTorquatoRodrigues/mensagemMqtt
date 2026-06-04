import { useEffect, useState } from 'react';
import {
  Modal,
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

  useEffect(() => {
    if (!visible) {
      setName('');
      setTopic('');
      setError(null);
    }
  }, [visible]);

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Nome da conversa é obrigatório.';
    }
    if (!topic.trim()) {
      return 'Tópico é obrigatório.';
    }
    if (/\s/.test(topic)) {
      return 'Tópico não pode conter espaços.';
    }
    if (topic.includes('#') || topic.includes('+')) {
      return 'Tópico não pode conter # ou +.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onCreate({ name: name.trim(), topic: topic.trim() });
      setError(null);
      onClose();
    } catch (err: unknown) {
      const code = (err as any)?.code;
      if (code === 'TOPIC_ALREADY_EXISTS') {
        setError('Tópico já existe.');
      } else {
        setError('Não foi possível criar a conversa.');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Nova conversa</Text>
          <TextInput
            style={styles.input}
            value={name}
            placeholder="Nome da conversa"
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            value={topic}
            placeholder="Tópico"
            onChangeText={setTopic}
            autoCapitalize="none"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Salvar</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  buttonPrimary: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 12,
  },
  buttonSecondary: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    marginTop: 12,
    color: '#c62828',
    fontSize: 14,
  },
});
