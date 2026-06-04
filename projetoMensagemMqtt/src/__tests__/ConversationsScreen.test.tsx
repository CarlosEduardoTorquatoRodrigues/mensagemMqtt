import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ConversationsScreen from '../screens/ConversationsScreen';

jest.mock('../repositories/conversationRepository', () => {
  return {
    ConversationRepositoryImpl: jest.fn().mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      delete: jest.fn(),
    })),
  };
});

jest.mock('../hooks/useMqtt', () => ({
  useMqtt: () => ({ status: 'disconnected', subscribe: jest.fn(), unsubscribe: jest.fn(), sendMessage: jest.fn(), addMessageListener: () => jest.fn(), connect: jest.fn() }),
}));

test('shows empty state when no conversations', async () => {
  const { getByText } = render(<ConversationsScreen onOpenConversation={jest.fn()} openSettings={jest.fn()} />);
  await waitFor(() => expect(getByText('Nenhuma conversa')).toBeTruthy());
});
