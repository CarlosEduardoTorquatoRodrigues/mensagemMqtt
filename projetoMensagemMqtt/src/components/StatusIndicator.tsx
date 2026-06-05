import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionStatus } from '../types';

const statusConfig: Record<ConnectionStatus, { label: string; color: string }> = {
  connected: { label: 'Conectado', color: '#2ecc71' },
  connecting: { label: 'Conectando', color: '#f1c40f' },
  disconnected: { label: 'Desconectado', color: '#e67e22' },
  error: { label: 'Erro de conexão', color: '#e74c3c' },
};

interface Props {
  status: ConnectionStatus;
}

export function StatusIndicator({ status }: Props) {
  const config = statusConfig[status];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
});
