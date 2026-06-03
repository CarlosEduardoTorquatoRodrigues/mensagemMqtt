import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionStatus } from '../types';

interface Props {
  status: ConnectionStatus;
}

export default function StatusIndicator({ status }: Props) {
  const color =
    status === 'connected' ? '#2ecc71' : status === 'connecting' ? '#f1c40f' : '#e74c3c';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  text: { fontSize: 14 },
});
