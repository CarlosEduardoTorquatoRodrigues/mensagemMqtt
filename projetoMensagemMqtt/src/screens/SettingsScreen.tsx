import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_BROKER } from '../config';
import { Settings, UpdateSettingsInput, ConnectionStatus } from '../types';
import { StatusIndicator } from '../components/StatusIndicator';

interface Props {
  settings: Settings | null;
  status: ConnectionStatus;
  onSave: (input: UpdateSettingsInput) => Promise<Settings>;
  onBack?: () => void;
}

export function SettingsScreen({ settings, status, onSave, onBack }: Props) {
  const [nickname, setNickname] = useState(settings?.nickname ?? '');
  const [brokerHost, setBrokerHost] = useState(settings?.brokerHost ?? DEFAULT_BROKER.host);
  const [brokerPort, setBrokerPort] = useState(settings?.brokerPort ?? DEFAULT_BROKER.port);
  const [useSsl, setUseSsl] = useState(settings?.useSsl ?? DEFAULT_BROKER.useSsl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setNickname(settings.nickname);
      setBrokerHost(settings.brokerHost);
      setBrokerPort(settings.brokerPort);
      setUseSsl(settings.useSsl);
    }
  }, [settings]);

  const validateHost = (value: string) => {
    if (!value.trim()) {
      return 'Host do broker é obrigatório.';
    }
    if (/\s/.test(value) || /^wss?:\/\//i.test(value)) {
      return 'Host não pode conter espaços ou esquema (ws://, wss://).';
    }
    return null;
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);

    const hostError = validateHost(brokerHost);
    if (hostError) {
      setError(hostError);
      return;
    }

    if (!nickname.trim()) {
      setError('Apelido é obrigatório.');
      return;
    }

    if (!brokerPort || Number.isNaN(brokerPort)) {
      setError('Porta do broker é obrigatória.');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        nickname: nickname.trim(),
        brokerHost: brokerHost.trim(),
        brokerPort,
        useSsl,
      });
      setMessage('Configurações salvas.');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar ajustes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ajustes</Text>
        <StatusIndicator status={status} />
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder="Apelido"
          value={nickname}
          onChangeText={setNickname}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Host do broker"
          value={brokerHost}
          onChangeText={setBrokerHost}
          autoCapitalize="none"
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Porta do broker"
          value={String(brokerPort)}
          onChangeText={(value) => setBrokerPort(Number(value))}
          keyboardType="numeric"
          editable={!saving}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Usar SSL</Text>
          <Switch value={useSsl} onValueChange={setUseSsl} disabled={saving} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    color: '#222',
  },
  backButton: {
    marginBottom: 14,
  },
  backText: {
    color: '#4b7bec',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4b7bec',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#e74c3c',
    marginBottom: 12,
  },
  success: {
    color: '#2ecc71',
    marginBottom: 12,
  },
});
