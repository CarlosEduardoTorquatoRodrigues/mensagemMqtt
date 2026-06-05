import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionStatus } from '../types';

const statusConfig: Record<ConnectionStatus, { label: string; color: string; bg: string }> = {
  connected:    { label: 'Conectado',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  connecting:   { label: 'Conectando…',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  disconnected: { label: 'Desconectado',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)'},
  error:        { label: 'Erro de conexão',color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

interface Props {
  status: ConnectionStatus;
}

export function StatusIndicator({ status }: Props) {
  const cfg = statusConfig[status];
  return (
    <View
      style={[styles.pill, { backgroundColor: cfg.bg }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status da conexão: ${cfg.label}`}
    >
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});