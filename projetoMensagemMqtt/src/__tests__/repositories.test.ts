import { settingsRepository } from '../repositories/settingsRepository';
import { conversationRepository } from '../repositories/conversationRepository';
import { messageRepository } from '../repositories/messageRepository';
import { getDatabase } from '../database/database';

jest.mock('../database/database', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
}));

type MockDatabase = {
  getAllAsync: jest.Mock<any, any>;
  runAsync: jest.Mock<any, any>;
};

const makeDatabase = (): MockDatabase => ({
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
});

const mockedGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SettingsRepository', () => {
  it('save first time generates clientId and persists data', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([]);
    database.runAsync.mockResolvedValueOnce({});

    const result = await settingsRepository.save({
      nickname: 'Rafael',
      brokerHost: 'broker.hivemq.com',
      brokerPort: 8884,
      useSsl: true,
    });

    expect(result.nickname).toBe('Rafael');
    expect(result.brokerHost).toBe('broker.hivemq.com');
    expect(result.brokerPort).toBe(8884);
    expect(result.useSsl).toBe(true);
    expect(result.clientId).toBeDefined();
    expect(database.runAsync).toHaveBeenCalledWith(
      'INSERT INTO settings (id, nickname, broker_host, broker_port, use_ssl, client_id) VALUES (1, ?, ?, ?, ?, ?)',
      'Rafael',
      'broker.hivemq.com',
      8884,
      1,
      result.clientId,
    );
  });

  it('save second time keeps the same clientId', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([
      {
        nickname: 'Rafael',
        broker_host: 'broker.hivemq.com',
        broker_port: 8884,
        use_ssl: 1,
        client_id: 'existing-client-id',
      },
    ]);
    database.runAsync.mockResolvedValueOnce({});

    const result = await settingsRepository.save({ nickname: 'Cris' });

    expect(result.clientId).toBe('existing-client-id');
    expect(result.nickname).toBe('Cris');
    expect(database.runAsync).toHaveBeenCalledWith(
      'UPDATE settings SET nickname = ?, broker_host = ?, broker_port = ?, use_ssl = ?, client_id = ? WHERE id = 1',
      'Cris',
      'broker.hivemq.com',
      8884,
      1,
      'existing-client-id',
    );
  });

  it('save without nickname throws INVALID_INPUT', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([]);

    await expect(
      settingsRepository.save({
        nickname: '',
        brokerHost: 'broker.hivemq.com',
        brokerPort: 8884,
        useSsl: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
});

describe('ConversationRepository', () => {
  it('create returns conversation with id and createdAt', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([]);
    database.runAsync.mockResolvedValueOnce({});

    const conversation = await conversationRepository.create({
      name: 'Futebol',
      topic: 'sala/futebol',
    });

    expect(conversation.id).toBeDefined();
    expect(conversation.name).toBe('Futebol');
    expect(conversation.topic).toBe('sala/futebol');
    expect(conversation.createdAt).toBeDefined();
    expect(database.runAsync).toHaveBeenCalledWith(
      'INSERT INTO conversations (id, name, topic, created_at) VALUES (?, ?, ?, ?)',
      conversation.id,
      'Futebol',
      'sala/futebol',
      conversation.createdAt,
    );
  });

  it('create with duplicate topic throws TOPIC_ALREADY_EXISTS', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([{ id: 'already' }]);

    await expect(
      conversationRepository.create({ name: 'Futebol', topic: 'sala/futebol' }),
    ).rejects.toMatchObject({ code: 'TOPIC_ALREADY_EXISTS' });
  });

  it('findAll on empty returns []', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([]);

    const result = await conversationRepository.findAll();

    expect(result).toEqual([]);
  });

  it('findAll with two conversations returns sorted by createdAt DESC', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: '2',
        name: 'Second',
        topic: 'topic/second',
        created_at: '2026-06-03T11:00:00.000Z',
      },
      {
        id: '1',
        name: 'First',
        topic: 'topic/first',
        created_at: '2026-06-03T10:00:00.000Z',
      },
    ]);

    const result = await conversationRepository.findAll();

    expect(result).toEqual([
      {
        id: '2',
        name: 'Second',
        topic: 'topic/second',
        createdAt: '2026-06-03T11:00:00.000Z',
      },
      {
        id: '1',
        name: 'First',
        topic: 'topic/first',
        createdAt: '2026-06-03T10:00:00.000Z',
      },
    ]);
  });

  it('findByTopic returns conversation or null', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: '1',
        name: 'Futebol',
        topic: 'sala/futebol',
        created_at: '2026-06-03T11:00:00.000Z',
      },
    ]);

    const result = await conversationRepository.findByTopic('sala/futebol');

    expect(result).toEqual({
      id: '1',
      name: 'Futebol',
      topic: 'sala/futebol',
      createdAt: '2026-06-03T11:00:00.000Z',
    });
  });

  it('delete removes conversation by id', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.runAsync.mockResolvedValueOnce({});

    await conversationRepository.delete('123');

    expect(database.runAsync).toHaveBeenCalledWith('DELETE FROM conversations WHERE id = ?', '123');
  });

  it('rename with valid name returns conversation with new name and preserves topic', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([{ id: 'conv-1' }]); // Conversation exists
    database.runAsync.mockResolvedValueOnce({}); // UPDATE succeeded
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: 'conv-1',
        name: 'Novo Nome',
        topic: 'sala/futebol',
        created_at: '2026-06-03T11:00:00.000Z',
      },
    ]); // findById returns updated conversation

    const result = await conversationRepository.rename('conv-1', 'Novo Nome');

    expect(result.name).toBe('Novo Nome');
    expect(result.topic).toBe('sala/futebol');
    expect(result.id).toBe('conv-1');
    expect(database.runAsync).toHaveBeenCalledWith(
      'UPDATE conversations SET name = ? WHERE id = ?',
      'Novo Nome',
      'conv-1',
    );
  });

  it('rename with empty name throws INVALID_INPUT', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);

    await expect(conversationRepository.rename('conv-1', '')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('rename with only spaces throws INVALID_INPUT', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);

    await expect(conversationRepository.rename('conv-1', '   ')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('rename with non-existent id throws INVALID_INPUT', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([]); // Conversation not found

    await expect(conversationRepository.rename('non-existent', 'New Name')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('rename preserves messages (messageRepository.findByConversation returns messages after rename)', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    // Setup for rename
    database.getAllAsync.mockResolvedValueOnce([{ id: 'conv-1' }]); // Conversation exists
    database.runAsync.mockResolvedValueOnce({}); // UPDATE succeeded
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: 'conv-1',
        name: 'Novo Nome',
        topic: 'sala/futebol',
        created_at: '2026-06-03T11:00:00.000Z',
      },
    ]); // findById for rename

    // Perform rename
    await conversationRepository.rename('conv-1', 'Novo Nome');

    // Setup for findByConversation
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender: 'Rafael',
        body: 'Test message',
        direction: 'sent',
        created_at: '2026-06-03T10:00:00.000Z',
      },
    ]);

    const messages = await messageRepository.findByConversation('conv-1');

    expect(messages).toEqual([
      {
        id: 'm1',
        conversationId: 'conv-1',
        sender: 'Rafael',
        body: 'Test message',
        direction: 'sent',
        createdAt: '2026-06-03T10:00:00.000Z',
      },
    ]);
  });
});

describe('MessageRepository', () => {
  it('create returns message with id and createdAt', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.runAsync.mockResolvedValueOnce({});

    const message = await messageRepository.create({
      conversationId: 'conv-1',
      sender: 'Rafael',
      body: 'Hello',
      direction: 'sent',
    });

    expect(message.id).toBeDefined();
    expect(message.conversationId).toBe('conv-1');
    expect(message.sender).toBe('Rafael');
    expect(message.body).toBe('Hello');
    expect(message.direction).toBe('sent');
    expect(message.createdAt).toBeDefined();
    expect(database.runAsync).toHaveBeenCalledWith(
      'INSERT INTO messages (id, conversation_id, sender, body, direction, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      message.id,
      'conv-1',
      'Rafael',
      'Hello',
      'sent',
      message.createdAt,
    );
  });

  it('findByConversation returns messages sorted by createdAt ASC', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: '1',
        conversation_id: 'conv-1',
        sender: 'Rafael',
        body: 'First',
        direction: 'sent',
        created_at: '2026-06-03T10:00:00.000Z',
      },
      {
        id: '2',
        conversation_id: 'conv-1',
        sender: 'Ana',
        body: 'Second',
        direction: 'received',
        created_at: '2026-06-03T11:00:00.000Z',
      },
    ]);

    const messages = await messageRepository.findByConversation('conv-1');

    expect(messages).toEqual([
      {
        id: '1',
        conversationId: 'conv-1',
        sender: 'Rafael',
        body: 'First',
        direction: 'sent',
        createdAt: '2026-06-03T10:00:00.000Z',
      },
      {
        id: '2',
        conversationId: 'conv-1',
        sender: 'Ana',
        body: 'Second',
        direction: 'received',
        createdAt: '2026-06-03T11:00:00.000Z',
      },
    ]);
  });

  it('deleteByConversation with messages clears messages and calls DELETE', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.runAsync.mockResolvedValueOnce({});
    // After deletion, findByConversation returns []
    database.getAllAsync.mockResolvedValueOnce([]);

    await messageRepository.deleteByConversation('conv-1');

    const messages = await messageRepository.findByConversation('conv-1');

    expect(database.runAsync).toHaveBeenCalledWith(
      'DELETE FROM messages WHERE conversation_id = ?',
      'conv-1',
    );
    expect(messages).toEqual([]);
  });

  it('deleteByConversation preserves the conversation (conversationRepository.findById)', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.runAsync.mockResolvedValueOnce({});
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: 'conv-1',
        name: 'Futebol',
        topic: 'sala/futebol',
        created_at: '2026-06-03T11:00:00.000Z',
      },
    ]);

    await messageRepository.deleteByConversation('conv-1');

    const conv = await conversationRepository.findById('conv-1');

    expect(conv).toEqual({
      id: 'conv-1',
      name: 'Futebol',
      topic: 'sala/futebol',
      createdAt: '2026-06-03T11:00:00.000Z',
    });
  });

  it('deleteByConversation does not affect other conversations messages', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.runAsync.mockResolvedValueOnce({});
    // For other conversation, findByConversation returns its messages
    database.getAllAsync.mockResolvedValueOnce([
      {
        id: 'm1',
        conversation_id: 'conv-2',
        sender: 'Ana',
        body: 'Other',
        direction: 'received',
        created_at: '2026-06-03T12:00:00.000Z',
      },
    ]);

    await messageRepository.deleteByConversation('conv-1');

    const messages = await messageRepository.findByConversation('conv-2');

    expect(messages).toEqual([
      {
        id: 'm1',
        conversationId: 'conv-2',
        sender: 'Ana',
        body: 'Other',
        direction: 'received',
        createdAt: '2026-06-03T12:00:00.000Z',
      },
    ]);
  });

  it('deleteByConversation without messages is idempotent (does not throw)', async () => {
    const database = makeDatabase();
    mockedGetDatabase.mockResolvedValue(database as any);
    database.runAsync.mockResolvedValueOnce({});

    await expect(messageRepository.deleteByConversation('non-existent')).resolves.toBeUndefined();
  });
});
