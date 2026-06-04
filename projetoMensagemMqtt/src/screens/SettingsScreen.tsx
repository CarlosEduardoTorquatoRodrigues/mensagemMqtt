import React, { useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SettingsRepositoryImpl } from '../repositories/settingsRepository';
import { UpdateSettingsInput } from '../types';
import { useMqtt } from '../hooks/useMqtt';

const repo = new SettingsRepositoryImpl();

export default function SettingsScreen({ onSaved }: { onSaved?: () => void }) {
  const [nickname, setNickname] = useState('');
  const [brokerHost, setBrokerHost] = useState('');
  const [brokerPort, setBrokerPort] = useState('1883');
  const [useSsl, setUseSsl] = useState(false);
  const mqtt = useMqtt();

  useEffect(() => {
    repo.get().then((s) => {
      if (s) {
        setNickname(s.nickname);
        setBrokerHost(s.brokerHost);
        setBrokerPort(String(s.brokerPort));
        setUseSsl(s.useSsl);
      }
    });
  }, []);

  function validateHost(h: string) {
    if (!h.trim()) return 'Host obrigatório';
    if (h.includes(' ')) return 'Host não pode conter espaços';
    if (h.startsWith('ws://') || h.startsWith('wss://') || h.startsWith('http://')) return 'Host não deve conter esquema';
    return '';
  }

  async function save() {
    const hostErr = validateHost(brokerHost);
    if (hostErr) return Alert.alert('Aviso', hostErr);

    try {
      const input: UpdateSettingsInput = {
        nickname,
        brokerHost,
        brokerPort: Number(brokerPort),
        useSsl,
      };

      const saved = await repo.save(input);
      // tentar conectar
      mqtt.connect({ host: saved.brokerHost, port: saved.brokerPort, useSsl: saved.useSsl, clientId: saved.clientId });
      onSaved?.();
      Alert.alert('Sucesso', 'Configurações salvas');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Erro ao salvar');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Apelido</Text>
      <TextInput value={nickname} onChangeText={setNickname} style={styles.input} />
      <Text style={styles.label}>Broker Host</Text>
      <TextInput value={brokerHost} onChangeText={setBrokerHost} style={styles.input} />
      <Text style={styles.label}>Broker Port</Text>
      <TextInput value={brokerPort} onChangeText={setBrokerPort} style={styles.input} keyboardType="numeric" />
      <View style={{ height: 12 }} />
      <Button title="Salvar" onPress={save} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginTop: 4 },
});
