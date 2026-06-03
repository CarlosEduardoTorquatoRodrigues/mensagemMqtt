import React from 'react';
import { render } from '@testing-library/react-native';
import MessageBubble from '../components/MessageBubble';

const baseMessage = { id: '1', conversationId: 'c1', sender: 'Alice', body: 'Olá', direction: 'sent', createdAt: new Date().toISOString() };

test('sent message aligns right (no sender shown)', () => {
  const { queryByText } = render(<MessageBubble message={{ ...baseMessage, direction: 'sent' }} />);
  expect(queryByText('Alice')).toBeNull();
});

test('received message shows sender', () => {
  const { getByText } = render(<MessageBubble message={{ ...baseMessage, direction: 'received' }} />);
  expect(getByText('Alice')).toBeTruthy();
});
