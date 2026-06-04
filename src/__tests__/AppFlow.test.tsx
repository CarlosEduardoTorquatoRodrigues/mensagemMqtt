import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

jest.mock('../../src/repositories/settingsRepository', () => ({
  settingsRepository: {
    get: jest.fn(async () => ({
      nickname: 'Alice',
      brokerHost: 'broker.hivemq.com',
      brokerPort: 8884,
      useSsl: true,
      clientId: 'client-1',
    })),
    save: jest.fn(async (input: any) => ({
      nickname: input.nickname ?? 'Alice',
      brokerHost: input.brokerHost ?? 'broker.hivemq.com',
      brokerPort: input.brokerPort ?? 8884,
      useSsl: input.useSsl ?? true,
      clientId: 'client-1',
    })),
  },
}));

jest.mock('../../src/repositories/conversationRepository', () => ({
  conversationRepository: {
    findAll: jest.fn(async () => []),
    create: jest.fn(async (input: any) => ({
      id: 'conv-1',
      name: input.name,
      topic: input.topic,
      createdAt: new Date().toISOString(),
    })),
    delete: jest.fn(async () => {}),
  },
}));

jest.mock('../../src/repositories/messageRepository', () => ({
  messageRepository: {
    deleteByConversation: jest.fn(async () => {}),
    findByConversation: jest.fn(async () => []),
  },
}));

jest.mock('../../src/hooks/useMqtt', () => ({
  useMqtt: jest.fn(() => ({
    status: 'error',
    sendMessage: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}));

import App from '../../App';
import { NewConversationModal } from '../../src/components/NewConversationModal';
import { SettingsScreen } from '../../src/screens/SettingsScreen';
import { ChatScreen } from '../../src/screens/ChatScreen';

describe('App and UI behaviors', () => {
  it('does not break when broker status is error and still opens settings', async () => {
    const { getByText } = render(<App />);

    await waitFor(() => expect(getByText('Conversas')).toBeTruthy());
    expect(getByText('Ajustes')).toBeTruthy();

    fireEvent.press(getByText('Ajustes'));
    await waitFor(() => expect(getByText('Apelido')).toBeTruthy());
  });

  it('blocks invalid host on settings save', async () => {
    const onSave = jest.fn(async (_input: any): Promise<void> => {});
    const { getByText, getByPlaceholderText } = render(
      <SettingsScreen
        settings={null}
        status="connected"
        onSave={onSave}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Seu apelido'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('broker.hivemq.com'), 'ws://broker.hivemq.com');
    fireEvent.changeText(getByPlaceholderText('8884'), '8884');
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => expect(getByText(/Host inválido/)).toBeTruthy());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid topic in modal', async () => {
    const onCreate = jest.fn(async () => {});
    const { getByText, getByPlaceholderText } = render(
      <NewConversationModal visible onClose={() => {}} onCreate={onCreate} />
    );

    fireEvent.changeText(getByPlaceholderText('Nome da conversa'), 'Sala 1');
    fireEvent.changeText(getByPlaceholderText('Tópico'), 'topic#1');
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => expect(getByText(/Tópico não pode conter # ou \+/)).toBeTruthy());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('blocks sending empty message in chat', async () => {
    const onSendMessage = jest.fn(async () => ({
      id: 'msg1',
      conversationId: 'conv-1',
      sender: 'Alice',
      body: 'Oi',
      direction: 'sent' as const,
      createdAt: new Date().toISOString(),
    }));

    const conversation = {
      id: 'conv-1',
      name: 'Sala teste',
      topic: 'topic/1',
      createdAt: '2026-06-04T12:00:00.000Z',
    };

    const { getByText } = render(
      <ChatScreen
        conversation={conversation}
        status="connected"
        onBack={() => {}}
        onSendMessage={onSendMessage}
        refreshKey={0}
      />
    );

    await waitFor(() => expect(getByText('Enviar')).toBeTruthy());
    fireEvent.press(getByText('Enviar'));
    await waitFor(() => expect(getByText(/Digite uma mensagem antes de enviar/)).toBeTruthy());
    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
