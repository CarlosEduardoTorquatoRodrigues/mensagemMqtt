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

          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Text style={styles.titleIconText}>💬</Text>
            </View>
            <Text style={styles.title}>Nova conversa</Text>
          </View>

          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Time de frontend"
            placeholderTextColor="#4b5563"
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
            placeholderTextColor="#4b5563"
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1f2937',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
    alignSelf: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  titleIconText: {
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f9fafb',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 14,
    padding: 15,
    color: '#f9fafb',
    fontSize: 15,
    marginBottom: 18,
  },
  inputMono: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    color: '#10b981',
  },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 12,
    padding: 13,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
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
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  btnCancelText: {
    color: '#9ca3af',
    fontWeight: '700',
    fontSize: 15,
  },
  btnCreate: {
    backgroundColor: '#059669',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
  },
  btnCreateText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});