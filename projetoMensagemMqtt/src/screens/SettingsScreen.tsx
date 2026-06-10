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
    if (hostErr)          { setError(hostErr); return; }
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
              <Text style={styles.backBtnText}>⬅ Voltar</Text>
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
            placeholderTextColor="#4b5563"
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
            placeholderTextColor="#4b5563"
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
            placeholderTextColor="#4b5563"
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
              trackColor={{ false: '#1f2937', true: '#059669' }}
              thumbColor={useSsl ? '#34d399' : '#9ca3af'}
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
  flex: { flex: 1, backgroundColor: '#31adb683' },
  container: { padding: 20, paddingBottom: 48 },

  header: { marginBottom: 24 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  backBtnText: { color: '#10b981', fontWeight: '700', fontSize: 25, letterSpacing: 0.2 },
  title: { fontSize: 30, fontWeight: '800', color: '#f9fafb', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#ffffff', lineHeight: 20 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    color: '#f9fafb',
    fontSize: 15,
    marginBottom: 14,
  },
  inputMono: { fontFamily: 'monospace', letterSpacing: 0.4, color: '#10b981' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: '#1f2937',
  },
  switchHint: { fontSize: 11, color: '#4b5563', marginTop: 3 },

  feedbackError: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  feedbackErrorText: { color: '#fca5a5', fontSize: 13 },
  feedbackSuccess: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  feedbackSuccessText: { color: '#6ee7b7', fontSize: 13 },

  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#10b981',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});