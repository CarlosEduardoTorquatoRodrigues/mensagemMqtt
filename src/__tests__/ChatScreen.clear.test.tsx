import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../../src/repositories/messageRepository', () => ({
  messageRepository: {
    findByConversation: jest.fn(async (conversationId: string) => [
      {
        id: 'm1',
        conversationId,
        sender: 'Alice',
        body: 'Oi',
        direction: 'received',
        createdAt: new Date().toISOString(),
      },
    ]),
    deleteByConversation: jest.fn(async () => {}),
  },
}));

import { ChatScreen } from '../../src/screens/ChatScreen';

describe('ChatScreen limpar histórico', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('confirma limpeza e esvazia a lista', async () => {
    const { getByText, queryByText } = render(
      <ChatScreen
        conversation={{ id: 'conv-1', name: 'Sala teste', topic: 't/1', createdAt: '' }}
        status="connected"
        onBack={() => {}}
        onSendMessage={jest.fn()}
        refreshKey={0}
      />
    );

    await waitFor(() => expect(getByText('Oi')).toBeTruthy());

    // mock Alert to press the confirm button
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons?: any[]) => {
      const confirm = buttons && buttons.find((b: any) => b.text === 'Apagar');
      if (confirm && typeof confirm.onPress === 'function') confirm.onPress();
    });

    fireEvent.press(getByText('Limpar'));

    const { messageRepository } = require('../../src/repositories/messageRepository');
    await waitFor(() => expect(messageRepository.deleteByConversation).toHaveBeenCalledWith('conv-1'));

    await waitFor(() => expect(queryByText('Oi')).toBeNull());
  });

  it('cancela limpeza e preserva mensagens', async () => {
    const { getByText } = render(
      <ChatScreen
        conversation={{ id: 'conv-1', name: 'Sala teste', topic: 't/1', createdAt: '' }}
        status="connected"
        onBack={() => {}}
        onSendMessage={jest.fn()}
        refreshKey={0}
      />
    );

    await waitFor(() => expect(getByText('Oi')).toBeTruthy());

    // mock Alert to do nothing (cancel)
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    fireEvent.press(getByText('Limpar'));

    const { messageRepository } = require('../../src/repositories/messageRepository');
    expect(messageRepository.deleteByConversation).not.toHaveBeenCalled();
    expect(getByText('Oi')).toBeTruthy();
  });

  it('após limpar, conversa permanece e aceita nova mensagem', async () => {
    const onSend = jest.fn(async () => ({
      id: 'm2',
      conversationId: 'conv-1',
      sender: 'Alice',
      body: 'Nova',
      direction: 'sent' as const,
      createdAt: new Date().toISOString(),
    }));

    const { getByText, getByPlaceholderText } = render(
      <ChatScreen
        conversation={{ id: 'conv-1', name: 'Sala teste', topic: 't/1', createdAt: '' }}
        status="connected"
        onBack={() => {}}
        onSendMessage={onSend}
        refreshKey={0}
      />
    );

    await waitFor(() => expect(getByText('Oi')).toBeTruthy());

    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons?: any[]) => {
      const confirm = buttons && buttons.find((b: any) => b.text === 'Apagar');
      if (confirm && typeof confirm.onPress === 'function') confirm.onPress();
    });

    fireEvent.press(getByText('Limpar'));

    const { messageRepository } = require('../../src/repositories/messageRepository');
    await waitFor(() => expect(messageRepository.deleteByConversation).toHaveBeenCalledWith('conv-1'));

    // send a new message
    fireEvent.changeText(getByPlaceholderText('Digite sua mensagem'), 'Nova');
    fireEvent.press(getByText('Enviar'));

    await waitFor(() => expect(onSend).toHaveBeenCalled());
    await waitFor(() => expect(getByText('Nova')).toBeTruthy());
  });
});
