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
  const [nickname, setNickname]     = useState(settings?.nickname  ?? '');
  const [brokerHost, setBrokerHost] = useState(settings?.brokerHost ?? DEFAULT_BROKER.host);
  const [brokerPort, setBrokerPort] = useState(settings?.brokerPort ?? DEFAULT_BROKER.port);
  const [useSsl, setUseSsl]         = useState(settings?.useSsl    ?? DEFAULT_BROKER.useSsl);
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setNickname(settings.nickname);
      setBrokerHost(settings.brokerHost);
      setBrokerPort(settings.brokerPort);
      setUseSsl(settings.useSsl);
    }
  }, [settings]);

  const validateHost = (value: string) => {
    if (!value.trim()) return 'Host do broker é obrigatório.';
    if (/\s/.test(value) || /^wss?:\/\//i.test(value))
      return 'Host sem espaços nem esquema (ws://, wss://).';
    return null;
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);
    const hostErr = validateHost(brokerHost);
    if (hostErr)         { setError(hostErr); return; }
    if (!nickname.trim()) { setError('Apelido é obrigatório.'); return; }
    if (!brokerPort || Number.isNaN(brokerPort)) { setError('Porta é obrigatória.'); return; }

    setSaving(true);
    try {
      await onSave({ nickname: nickname.trim(), brokerHost: brokerHost.trim(), brokerPort, useSsl });
      setMessage('Configurações salvas com sucesso.');
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao salvar ajustes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Cabeçalho */}
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Voltar para conversas"
            >
              <Text style={styles.backBtnText}>← Voltar</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configure seu apelido e o broker MQTT.</Text>
        </View>

        <StatusIndicator status={status} />

        {/* Seção perfil */}
        <Text style={styles.sectionLabel}>Perfil</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Apelido</Text>
          <TextInput
            style={styles.input}
            placeholder="Como você quer ser chamado"
            placeholderTextColor="#475569"
            value={nickname}
            onChangeText={setNickname}
            editable={!saving}
            accessible
            accessibilityLabel="Apelido"
          />
        </View>

        {/* Seção broker */}
        <Text style={styles.sectionLabel}>Broker MQTT</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Host</Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            placeholder="broker.hivemq.com"
            placeholderTextColor="#475569"
            value={brokerHost}
            onChangeText={setBrokerHost}
            autoCapitalize="none"
            editable={!saving}
            accessible
            accessibilityLabel="Host do broker"
          />
          <Text style={styles.fieldLabel}>Porta</Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            placeholder="8884"
            placeholderTextColor="#475569"
            value={String(brokerPort)}
            onChangeText={(v) => setBrokerPort(Number(v))}
            keyboardType="numeric"
            editable={!saving}
            accessible
            accessibilityLabel="Porta do broker"
          />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.fieldLabel}>Usar SSL</Text>
              <Text style={styles.switchHint}>Recomendado para brokers públicos</Text>
            </View>
            <Switch
              value={useSsl}
              onValueChange={setUseSsl}
              disabled={saving}
              trackColor={{ false: '#334155', true: '#0b7525' }}
              thumbColor="#fff"
              accessible
              accessibilityLabel="Usar SSL"
              accessibilityRole="switch"
            />
          </View>
        </View>

        {/* Feedback */}
        {error ? (
          <View style={styles.feedbackError}>
            <Text style={styles.feedbackErrorText}>⚠ {error}</Text>
          </View>
        ) : null}
        {message ? (
          <View style={styles.feedbackSuccess}>
            <Text style={styles.feedbackSuccessText}>✓ {message}</Text>
          </View>
        ) : null}

        {/* Botão salvar */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessible
          accessibilityRole="button"
          accessibilityLabel={saving ? 'Salvando configurações' : 'Salvar configurações'}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Salvar configurações</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#2e788171' },
  container: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 20 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start' },
  backBtnText: { color: '#0b7525', fontWeight: '700', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 13,
    color: '#f1f5f9',
    fontSize: 15,
    marginBottom: 12,
  },
  inputMono: { fontFamily: 'monospace', letterSpacing: 0.4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  switchHint: { fontSize: 11, color: '#475569', marginTop: 2 },

  feedbackError: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  feedbackErrorText: { color: '#fca5a5', fontSize: 13 },
  feedbackSuccess: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  feedbackSuccessText: { color: '#86efac', fontSize: 13 },

  saveBtn: {
    backgroundColor: '#0b7525',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});