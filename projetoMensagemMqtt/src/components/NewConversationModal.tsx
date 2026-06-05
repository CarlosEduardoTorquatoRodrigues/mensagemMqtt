import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
    if (!name.trim()) return 'Nome é obrigatório.';
    if (!topic.trim()) return 'Tópico é obrigatório.';
    if (/\s/.test(topic)) return 'Tópico não pode conter espaços.';
    if (/[#+]/.test(topic)) return 'Tópico não pode conter # ou +.';
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setCreating(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), topic: topic.trim() });
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao criar conversa.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Nova conversa</Text>
          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Time de frontend"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
            editable={!creating}
            accessible
            accessibilityLabel="Nome da conversa"
          />
          <Text style={styles.fieldLabel}>Tópico MQTT</Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            placeholder="Ex: equipe/frontend"
            placeholderTextColor="#475569"
            value={topic}
            onChangeText={setTopic}
            editable={!creating}
            autoCapitalize="none"
            accessible
            accessibilityLabel="Tópico MQTT"
          />
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onClose}
              disabled={creating}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnCreate, creating && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={creating}
              accessible
              accessibilityRole="button"
              accessibilityLabel={creating ? 'Criando conversa' : 'Criar conversa'}
            >
              {creating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnCreateText}>Criar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 15,
    marginBottom: 16,
  },
  inputMono: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnCancelText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 15,
  },
  btnCreate: {
    backgroundColor: '#0b7525',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnCreateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});