import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StatusIndicator } from '../components/StatusIndicator';
import { MessageBubble } from '../components/MessageBubble';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { conversationRepository } from '../repositories/conversationRepository';
import { messageRepository } from '../repositories/messageRepository';
import { useMqtt } from '../hooks/useMqtt';

jest.mock('expo-sqlite', () => ({ openDatabase: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'uuid') }));
jest.mock('mqtt', () => ({ connect: jest.fn() }));

jest.mock('../repositories/conversationRepository', () => ({
  conversationRepository: {
    create: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../repositories/messageRepository', () => ({
  messageRepository: {
    create: jest.fn(),
    findByConversation: jest.fn(),
    deleteByConversation: jest.fn(),
  },
}));

jest.mock('../repositories/settingsRepository', () => ({
  settingsRepository: {
    get: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock('../hooks/useMqtt', () => ({
  useMqtt: jest.fn(),
}));

const mockedConversationRepository = conversationRepository as jest.Mocked<typeof conversationRepository>;
const mockedMessageRepository = messageRepository as jest.Mocked<typeof messageRepository>;
const mockedUseMqtt = useMqtt as jest.MockedFunction<typeof useMqtt>;

describe('StatusIndicator', () => {
  it('renders connected status', () => {
    const { getByText } = render(<StatusIndicator status="connected" />);
    expect(getByText('Conectado')).toBeTruthy();
  });

  it('renders error status', () => {
    const { getByText } = render(<StatusIndicator status="error" />);
    expect(getByText('Erro de conexão')).toBeTruthy();
  });
});

describe('MessageBubble', () => {
  it('renders sent messages on the right', () => {
    const message = {
      id: '1',
      conversationId: 'c1',
      sender: 'João',
      body: 'Oi',
      direction: 'sent' as const,
      createdAt: '2026-06-04T12:00:00.000Z',
    };

    const { getByText, queryByText } = render(<MessageBubble message={message} />);
    expect(getByText('Oi')).toBeTruthy();
    expect(queryByText('João')).toBeNull();
  });

  it('renders received messages with sender', () => {
    const message = {
      id: '2',
      conversationId: 'c1',
      sender: 'Maria',
      body: 'Olá',
      direction: 'received' as const,
      createdAt: '2026-06-04T12:01:00.000Z',
    };

    const { getByText } = render(<MessageBubble message={message} />);
    expect(getByText('Olá')).toBeTruthy();
    expect(getByText('Maria')).toBeTruthy();
  });
});

describe('ConversationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMqtt.mockReturnValue({
      status: 'disconnected',
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      sendMessage: jest.fn(),
    });
  });

  it('shows empty state when there are no conversations', async () => {
    mockedConversationRepository.findAll.mockResolvedValue([]);

    const { getByText } = render(
      <ConversationsScreen
        status="disconnected"
        onOpenSettings={jest.fn()}
        onOpenChat={jest.fn()}
        onConversationCreated={jest.fn()}
        onConversationDeleted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getByText('Nenhuma conversa encontrada.')).toBeTruthy();
    });
  });

  it('renders conversations when present', async () => {
    const conversations = [
      { id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' },
    ];
    mockedConversationRepository.findAll.mockResolvedValue(conversations);

    const { getByText } = render(
      <ConversationsScreen
        status="connected"
        onOpenSettings={jest.fn()}
        onOpenChat={jest.fn()}
        onConversationCreated={jest.fn()}
        onConversationDeleted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getByText('Sala 1')).toBeTruthy();
      expect(getByText('mensagemmqtt/sala1')).toBeTruthy();
    });
  });

  it('blocks invalid topic on create', async () => {
    mockedConversationRepository.findAll.mockResolvedValue([]);
    const onCreate = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <ConversationsScreen
        status="connected"
        onOpenSettings={jest.fn()}
        onOpenChat={jest.fn()}
        onConversationCreated={jest.fn()}
        onConversationDeleted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getByText('Nenhuma conversa encontrada.')).toBeTruthy();
    });

    fireEvent.press(getByText('Nova conversa'));
    fireEvent.changeText(getByPlaceholderText('Nome da conversa'), 'Sala 2');
    fireEvent.changeText(getByPlaceholderText('Tópico MQTT'), 'com espaço');
    fireEvent.press(getByText('Criar'));

    await waitFor(() => expect(getByText('Tópico não pode conter espaços.')).toBeTruthy());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('asks for confirmation and deletes conversation', async () => {
    const conversations = [
      { id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' },
    ];
    mockedConversationRepository.findAll.mockResolvedValue(conversations);
    mockedConversationRepository.delete.mockResolvedValue();

    const onConversationDeleted = jest.fn();

    jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      const confirmButton = buttons?.find((button) => button.style === 'destructive');
      confirmButton?.onPress?.();
    });

    const { getByText } = render(
      <ConversationsScreen
        status="connected"
        onOpenSettings={jest.fn()}
        onOpenChat={jest.fn()}
        onConversationCreated={jest.fn()}
        onConversationDeleted={onConversationDeleted}
      />,
    );

    await waitFor(() => expect(getByText('Sala 1')).toBeTruthy());
    fireEvent(getByText('Sala 1'), 'onLongPress');

    await waitFor(() => {
      expect(mockedConversationRepository.delete).toHaveBeenCalledWith('c1');
      expect(onConversationDeleted).toHaveBeenCalledWith('mensagemmqtt/sala1');
    });
  });
});

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMqtt.mockReturnValue({
      status: 'connected',
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      sendMessage: jest.fn(),
    });
  });

  it('sends a message and clears the input', async () => {
    mockedMessageRepository.findByConversation.mockResolvedValue([]);
    mockedMessageRepository.create.mockResolvedValue({
      id: 'm1',
      conversationId: 'c1',
      sender: 'João',
      body: 'Oi',
      direction: 'sent',
      createdAt: '2026-06-04T12:00:00.000Z',
    });

    const { getByPlaceholderText, getByText } = render(
      <ChatScreen
        conversation={{ id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' }}
        settings={{ nickname: 'João', brokerHost: 'broker.hivemq.com', brokerPort: 8884, useSsl: true, clientId: 'client-1' }}
        status="connected"
        sendMessage={jest.fn()}
        onBack={jest.fn()}
        refreshKey={0}
      />,
    );

    await waitFor(() => expect(getByPlaceholderText('Digite sua mensagem')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Digite sua mensagem'), 'Oi');
    fireEvent.press(getByText('Enviar'));

    await waitFor(() => {
      expect(mockedMessageRepository.create).toHaveBeenCalledWith({
        conversationId: 'c1',
        sender: 'João',
        body: 'Oi',
        direction: 'sent',
      });
      expect(getByPlaceholderText('Digite sua mensagem').props.value).toBe('');
    });
  });

  it('blocks empty messages', async () => {
    mockedMessageRepository.findByConversation.mockResolvedValue([]);

    const { getByText } = render(
      <ChatScreen
        conversation={{ id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' }}
        settings={{ nickname: 'João', brokerHost: 'broker.hivemq.com', brokerPort: 8884, useSsl: true, clientId: 'client-1' }}
        status="connected"
        sendMessage={jest.fn()}
        onBack={jest.fn()}
        refreshKey={0}
      />,
    );

    await waitFor(() => expect(getByText('Enviar')).toBeTruthy());
    fireEvent.press(getByText('Enviar'));

    await waitFor(() => {
      expect(getByText('Digite uma mensagem antes de enviar.')).toBeTruthy();
    });
    expect(mockedMessageRepository.create).not.toHaveBeenCalled();
  });

  it('confirms clearing history and empties the list', async () => {
    mockedMessageRepository.findByConversation
      .mockResolvedValueOnce([
        {
          id: 'm1',
          conversationId: 'c1',
          sender: 'João',
          body: 'Oi',
          direction: 'received',
          createdAt: '2026-06-04T12:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([]);
    mockedMessageRepository.deleteByConversation.mockResolvedValue();

    const { getByText, queryByText } = render(
      <ChatScreen
        conversation={{ id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' }}
        settings={{ nickname: 'João', brokerHost: 'broker.hivemq.com', brokerPort: 8884, useSsl: true, clientId: 'client-1' }}
        status="connected"
        sendMessage={jest.fn()}
        onBack={jest.fn()}
        refreshKey={0}
      />,
    );

    await waitFor(() => expect(getByText('Oi')).toBeTruthy());
    fireEvent.press(getByText('Limpar'));

    await waitFor(() => expect(getByText('Apagar todas as mensagens desta conversa? A conversa será mantida.')).toBeTruthy());
    fireEvent.press(getByText('Apagar'));

    await waitFor(() => {
      expect(mockedMessageRepository.deleteByConversation).toHaveBeenCalledWith('c1');
      expect(queryByText('Oi')).toBeNull();
    });
  });

  it('cancels clearing history and preserves messages', async () => {
    mockedMessageRepository.findByConversation.mockResolvedValue([
      {
        id: 'm2',
        conversationId: 'c1',
        sender: 'Maria',
        body: 'Olá',
        direction: 'received',
        createdAt: '2026-06-04T12:01:00.000Z',
      },
    ]);
    mockedMessageRepository.deleteByConversation.mockResolvedValue();

    const { getByText } = render(
      <ChatScreen
        conversation={{ id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' }}
        settings={{ nickname: 'João', brokerHost: 'broker.hivemq.com', brokerPort: 8884, useSsl: true, clientId: 'client-1' }}
        status="connected"
        sendMessage={jest.fn()}
        onBack={jest.fn()}
        refreshKey={0}
      />,
    );

    await waitFor(() => expect(getByText('Olá')).toBeTruthy());
    fireEvent.press(getByText('Limpar'));

    await waitFor(() => expect(getByText('Apagar todas as mensagens desta conversa? A conversa será mantida.')).toBeTruthy());
    fireEvent.press(getByText('Cancelar'));

    await waitFor(() => {
      expect(mockedMessageRepository.deleteByConversation).not.toHaveBeenCalled();
      expect(getByText('Olá')).toBeTruthy();
    });
  });

  it('preserves conversation and accepts new messages after clearing', async () => {
    mockedMessageRepository.findByConversation.mockResolvedValue([]);
    mockedMessageRepository.deleteByConversation.mockResolvedValue();
    mockedMessageRepository.create.mockResolvedValue({
      id: 'm3',
      conversationId: 'c1',
      sender: 'João',
      body: 'Nova',
      direction: 'sent',
      createdAt: '2026-06-04T12:10:00.000Z',
    });

    const { getByPlaceholderText, getByText } = render(
      <ChatScreen
        conversation={{ id: 'c1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' }}
        settings={{ nickname: 'João', brokerHost: 'broker.hivemq.com', brokerPort: 8884, useSsl: true, clientId: 'client-1' }}
        status="connected"
        sendMessage={jest.fn()}
        onBack={jest.fn()}
        refreshKey={0}
      />,
    );

    fireEvent.press(getByText('Limpar'));

    await waitFor(() => expect(getByText('Apagar todas as mensagens desta conversa? A conversa será mantida.')).toBeTruthy());
    fireEvent.press(getByText('Apagar'));

    await waitFor(() => expect(mockedMessageRepository.deleteByConversation).toHaveBeenCalledWith('c1'));

    // send new message
    fireEvent.changeText(getByPlaceholderText('Digite sua mensagem'), 'Nova');
    fireEvent.press(getByText('Enviar'));

    await waitFor(() => {
      expect(mockedMessageRepository.create).toHaveBeenCalledWith({
        conversationId: 'c1',
        sender: 'João',
        body: 'Nova',
        direction: 'sent',
      });
      expect(getByText('Nova')).toBeTruthy();
    });
  });
});

describe('SettingsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows validation message when host is invalid', async () => {
    const save = jest.fn().mockRejectedValue(new Error('Erro'));

    const { getByText, getByPlaceholderText } = render(
      <SettingsScreen
        settings={null}
        status="error"
        onSave={save}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Apelido'), 'João');
    fireEvent.changeText(getByPlaceholderText('Host do broker'), 'ws://broker');
    fireEvent.changeText(getByPlaceholderText('Porta do broker'), '8884');
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(getByText('Host não pode conter espaços ou esquema (ws://, wss://).')).toBeTruthy();
    });
    expect(save).not.toHaveBeenCalled();
  });
});
