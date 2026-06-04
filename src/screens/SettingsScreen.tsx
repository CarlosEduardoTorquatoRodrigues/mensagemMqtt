import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConnectionStatus, Settings, UpdateSettingsInput } from '../types';
import { StatusIndicator } from '../components/StatusIndicator';

interface Props {
  settings: Settings | null;
  status: ConnectionStatus;
  onSave: (input: UpdateSettingsInput) => Promise<void>;
  onBack?: () => void;
}

export function SettingsScreen({ settings, status, onSave, onBack }: Props) {
  const [nickname, setNickname] = useState(settings?.nickname ?? '');
  const [brokerHost, setBrokerHost] = useState(settings?.brokerHost ?? '');
  const [brokerPort, setBrokerPort] = useState(String(settings?.brokerPort ?? ''));
  const [useSsl, setUseSsl] = useState(settings?.useSsl ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNickname(settings?.nickname ?? '');
    setBrokerHost(settings?.brokerHost ?? '');
    setBrokerPort(String(settings?.brokerPort ?? ''));
    setUseSsl(settings?.useSsl ?? true);
  }, [settings]);

  const validateHost = (value: string): boolean => {
    const normalized = value.trim();
    if (!normalized) {
      return false;
    }
    if (/\s/.test(normalized)) {
      return false;
    }
    if (/^(?:ws|wss|http|https|mqtt|mqtts|tcp|ssl):\/\//i.test(normalized)) {
      return false;
    }
    return /^[A-Za-z0-9.-]+$/.test(normalized) || /^\[[0-9a-fA-F:]+\]$/.test(normalized);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('Apelido é obrigatório.');
      return;
    }

    if (!validateHost(brokerHost)) {
      setError('Host inválido. Não use espaços nem ws://, wss://, http:// ou https://.');
      return;
    }

    const portNumber = Number(brokerPort);
    if (!portNumber || portNumber <= 0) {
      setError('Porta inválida.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSave({
        nickname: nickname.trim(),
        brokerHost: brokerHost.trim(),
        brokerPort: portNumber,
        useSsl,
      });
    } catch (err: unknown) {
      setError('Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
        <StatusIndicator status={status} />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Apelido</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Seu apelido"
          autoCapitalize="words"
          returnKeyType="done"
        />
        <Text style={styles.label}>Host</Text>
        <TextInput
          style={styles.input}
          value={brokerHost}
          onChangeText={setBrokerHost}
          placeholder="broker.hivemq.com"
          autoCapitalize="none"
          keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
        />
        <Text style={styles.label}>Porta</Text>
        <TextInput
          style={styles.input}
          value={brokerPort}
          onChangeText={setBrokerPort}
          placeholder="8884"
          keyboardType="numeric"
        />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Usar SSL</Text>
          <Switch value={useSsl} onValueChange={setUseSsl} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
        {onBack ? (
          <TouchableOpacity style={styles.linkButton} onPress={onBack}>
            <Text style={styles.linkText}>Voltar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    marginTop: 12,
    color: '#424242',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  error: {
    marginTop: 16,
    color: '#c62828',
    fontSize: 14,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#1976d2',
    fontWeight: '700',
  },
});
