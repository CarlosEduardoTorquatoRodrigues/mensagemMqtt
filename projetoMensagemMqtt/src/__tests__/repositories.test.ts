jest.mock('../database/database', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'uuid-1'),
}));

const { getDatabase } = require('../database/database') as {
  getDatabase: jest.MockedFunction<() => Promise<any>>;
};

import { ConversationRepositoryImpl } from '../repositories/conversationRepository';
import { MessageRepositoryImpl } from '../repositories/messageRepository';
import { SettingsRepositoryImpl } from '../repositories/settingsRepository';

const settingsRepository = new SettingsRepositoryImpl();
const conversationRepository = new ConversationRepositoryImpl();
const messageRepository = new MessageRepositoryImpl();

interface DbRow {
  [key: string]: unknown;
}

class MemoryDatabase {
  settings: DbRow[] = [];
  conversations: DbRow[] = [];
  messages: DbRow[] = [];

  async getAllAsync(query: string, ...params: unknown[]) {
    const normalized = query.trim().toLowerCase();

    if (normalized.startsWith('select nickname')) {
      return this.settings.map((row) => row);
    }

    if (normalized.startsWith('select id from conversations where topic')) {
      return this.conversations.filter((row) => row.topic === params[0]);
    }

    if (normalized.startsWith('select id, name, topic, created_at from conversations order by created_at desc')) {
      return [...this.conversations].sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
    }

    if (normalized.startsWith('select id, name, topic, created_at from conversations where id =')) {
      return this.conversations.filter((row) => row.id === params[0]);
    }

    if (normalized.startsWith('select id, name, topic, created_at from conversations where topic =')) {
      return this.conversations.filter((row) => row.topic === params[0]);
    }

    if (normalized.startsWith('select id, conversation_id, sender, body, direction, created_at from messages where conversation_id =')) {
      return [...this.messages]
        .filter((row) => row.conversation_id === params[0])
        .sort((a, b) => (a.created_at as string).localeCompare(b.created_at as string));
    }

    throw new Error(`Unsupported query: ${query}`);
  }

  async runAsync(query: string, ...params: unknown[]) {
    const normalized = query.trim().toLowerCase();

    if (normalized.startsWith('update settings set')) {
      if (!this.settings.length) {
        throw new Error('No settings row present');
      }
      const [nickname, brokerHost, brokerPort, useSsl, clientId] = params;
      this.settings[0] = {
        ...this.settings[0],
        nickname,
        broker_host: brokerHost,
        broker_port: brokerPort,
        use_ssl: useSsl,
        client_id: clientId,
      };
      return;
    }

    if (normalized.startsWith('insert into settings')) {
      const [nickname, brokerHost, brokerPort, useSsl, clientId] = params;
      this.settings = [
        {
          id: 1,
          nickname,
          broker_host: brokerHost,
          broker_port: brokerPort,
          use_ssl: useSsl,
          client_id: clientId,
        },
      ];
      return;
    }

    if (normalized.startsWith('insert into conversations')) {
      const [id, name, topic, createdAt] = params;
      this.conversations.push({ id, name, topic, created_at: createdAt });
      return;
    }

    if (normalized.startsWith('delete from conversations where id =')) {
      const id = params[0];
      this.conversations = this.conversations.filter((row) => row.id !== id);
      this.messages = this.messages.filter((row) => row.conversation_id !== id);
      return;
    }

    if (normalized.startsWith('insert into messages')) {
      const [id, conversationId, sender, body, direction, createdAt] = params;
      this.messages.push({
        id,
        conversation_id: conversationId,
        sender,
        body,
        direction,
        created_at: createdAt,
      });
      return;
    }

    if (normalized.startsWith('delete from messages where conversation_id =')) {
      const conversationId = params[0];
      this.messages = this.messages.filter((row) => row.conversation_id !== conversationId);
      return;
    }

    throw new Error(`Unsupported command: ${query}`);
  }

  async execAsync(query: string) {
    const normalized = query.trim().toLowerCase();
    if (normalized.startsWith('delete from messages')) {
      this.messages = [];
      return;
    }
    if (normalized.startsWith('delete from conversations')) {
      this.conversations = [];
      return;
    }
    if (normalized.startsWith('delete from settings')) {
      this.settings = [];
      return;
    }
    throw new Error(`Unsupported exec command: ${query}`);
  }
}

let database: MemoryDatabase;

beforeAll(() => {
  database = new MemoryDatabase();
  getDatabase.mockResolvedValue(database as any);
});

beforeEach(async () => {
  database.settings = [];
  database.conversations = [];
  database.messages = [];
});

describe('SettingsRepository', () => {
  it('saves settings the first time and generates clientId', async () => {
    const saved = await settingsRepository.save({ nickname: 'Alice' });

    expect(saved.nickname).toBe('Alice');
    expect(saved.clientId).toBeTruthy();
    expect(saved.brokerHost).toBe('broker.hivemq.com');
    expect(saved.brokerPort).toBe(8884);
    expect(saved.useSsl).toBe(true);
  });

  it('keeps the same clientId on second save', async () => {
    const first = await settingsRepository.save({ nickname: 'Alice' });
    const second = await settingsRepository.save({ nickname: 'Bob' });

    expect(second.clientId).toBe(first.clientId);
    expect(second.nickname).toBe('Bob');
  });

  it('throws INVALID_INPUT when nickname is missing on first save', async () => {
    await expect(settingsRepository.save({})).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
});

describe('ConversationRepository', () => {
  it('creates a conversation with id and createdAt', async () => {
    const conversation = await conversationRepository.create({
      name: 'Futebol',
      topic: 'sala/futebol',
    });

    expect(conversation.id).toBeTruthy();
    expect(conversation.createdAt).toEqual(expect.any(String));
    expect(conversation.topic).toBe('sala/futebol');
  });

  it('throws TOPIC_ALREADY_EXISTS for duplicate topic', async () => {
    await conversationRepository.create({ name: 'Futebol', topic: 'sala/futebol' });

    await expect(
      conversationRepository.create({ name: 'Time', topic: 'sala/futebol' }),
    ).rejects.toMatchObject({ code: 'TOPIC_ALREADY_EXISTS' });
  });

  it('returns an empty array when no conversations exist', async () => {
    const conversations = await conversationRepository.findAll();

    expect(conversations).toEqual([]);
  });

  it('returns conversations ordered by createdAt descending', async () => {
    const first = await conversationRepository.create({ name: 'First', topic: 'sala/one' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await conversationRepository.create({ name: 'Second', topic: 'sala/two' });

    const conversations = await conversationRepository.findAll();

    expect(conversations[0].id).toBe(second.id);
    expect(conversations[1].id).toBe(first.id);
  });

  it('finds a conversation by topic or returns null', async () => {
    const created = await conversationRepository.create({
      name: 'Futebol',
      topic: 'sala/futebol',
    });

    const found = await conversationRepository.findByTopic('sala/futebol');
    const missing = await conversationRepository.findByTopic('sala/nao-existe');

    expect(found).toMatchObject({ id: created.id });
    expect(missing).toBeNull();
  });

  it('deletes a conversation and cascades messages', async () => {
    const conversation = await conversationRepository.create({
      name: 'Futebol',
      topic: 'sala/futebol',
    });

    await messageRepository.create({
      conversationId: conversation.id,
      sender: 'Alice',
      body: 'Oi',
      direction: 'sent',
    });

    await conversationRepository.delete(conversation.id);

    const deleted = await conversationRepository.findById(conversation.id);
    const messages = await messageRepository.findByConversation(conversation.id);

    expect(deleted).toBeNull();
    expect(messages).toEqual([]);
  });
});

describe('MessageRepository', () => {
  it('creates a message with id and createdAt', async () => {
    const conversation = await conversationRepository.create({
      name: 'Futebol',
      topic: 'sala/futebol',
    });

    const message = await messageRepository.create({
      conversationId: conversation.id,
      sender: 'Alice',
      body: 'Oi',
      direction: 'sent',
    });

    expect(message.id).toBeTruthy();
    expect(message.createdAt).toEqual(expect.any(String));
    expect(message.conversationId).toBe(conversation.id);
  });

  it('finds messages by conversation ordered by createdAt ascending', async () => {
    const conversation = await conversationRepository.create({
      name: 'Futebol',
      topic: 'sala/futebol',
    });

    const first = await messageRepository.create({
      conversationId: conversation.id,
      sender: 'Alice',
      body: 'Primeira',
      direction: 'sent',
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await messageRepository.create({
      conversationId: conversation.id,
      sender: 'Alice',
      body: 'Segunda',
      direction: 'sent',
    });

    const messages = await messageRepository.findByConversation(conversation.id);

    expect(messages.map((item) => item.id)).toEqual([first.id, second.id]);
  });
});
