import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionStatus } from '../types';

const statusConfig: Record<ConnectionStatus, { label: string; color: string; bg: string; border: string }> = {
  connected:    { label: 'Conectado',       color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)'  },
  connecting:   { label: 'Conectando…',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)'  },
  disconnected: { label: 'Desconectado',    color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)'  },
  error:        { label: 'Erro de conexão', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
};

interface Props {
  status: ConnectionStatus;
}

export function StatusIndicator({ status }: Props) {
  const cfg = statusConfig[status];
  return (
    <View
      style={[styles.pill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status da conexão: ${cfg.label}`}
    >
      <View style={[styles.dot, { backgroundColor: cfg.color }]}>
        <View style={[styles.dotInner, { backgroundColor: cfg.color }]} />
      </View>
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  dotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});