import { StyleSheet, Text, View } from 'react-native';
import { ConnectionStatus } from '../types';

const statusLabels: Record<ConnectionStatus, string> = {
  connected: 'Conectado',
  connecting: 'Conectando',
  disconnected: 'Desconectado',
  error: 'Erro',
};

const statusColors: Record<ConnectionStatus, string> = {
  connected: '#2e7d32',
  connecting: '#f9a825',
  disconnected: '#c62828',
  error: '#c62828',
};

interface Props {
  status: ConnectionStatus;
}

export function StatusIndicator({ status }: Props) {
  return (
    <View style={[styles.container, { borderColor: statusColors[status] }]}> 
      <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      <Text style={styles.text}>{statusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  text: {
    color: '#1f1f1f',
    fontWeight: '600',
  },
});
