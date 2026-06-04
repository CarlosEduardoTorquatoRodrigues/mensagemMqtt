import { EventEmitter } from 'events';

jest.mock('expo-crypto', () => {
  let uuidCounter = 0;
  return {
    __esModule: true,
    randomUUID: jest.fn(() => `uuid-${++uuidCounter}`),
  };
});

const mockSQLite = (() => {
  let state: {
    userVersion: number;
    settings: any | null;
    conversations: any[];
    messages: any[];
    foreignKeys: boolean;
  } = {
    userVersion: 0,
    settings: null,
    conversations: [],
    messages: [],
    foreignKeys: false,
  };

  const resetState = () => {
    state = {
      userVersion: 0,
      settings: null,
      conversations: [],
      messages: [],
      foreignKeys: false,
    };
  };

  const db = {
    execAsync: jest.fn(async (sql: string, params?: any[]) => {
      const normalized = sql.trim();

      if (normalized.startsWith('PRAGMA foreign_keys')) {
        state.foreignKeys = true;
        return;
      }

      if (normalized.startsWith('PRAGMA user_version = 1')) {
        state.userVersion = 1;
        return;
      }

      if (normalized.startsWith('INSERT OR REPLACE INTO settings')) {
        const [nickname, broker_host, broker_port, use_ssl, client_id] = params ?? [];
        state.settings = { nickname, broker_host, broker_port, use_ssl, client_id };
        return;
      }

      if (normalized.startsWith('INSERT INTO conversations')) {
        const [id, name, topic, created_at] = params ?? [];
        state.conversations.push({ id, name, topic, created_at });
        return;
      }

      if (normalized.startsWith('INSERT INTO messages')) {
        const [id, conversation_id, sender, body, direction, created_at] = params ?? [];
        state.messages.push({ id, conversation_id, sender, body, direction, created_at });
        return;
      }

      if (normalized.startsWith('DELETE FROM conversations')) {
        const [id] = params ?? [];
        state.conversations = state.conversations.filter((conversation) => conversation.id !== id);
        if (state.foreignKeys) {
          state.messages = state.messages.filter((message) => message.conversation_id !== id);
        }
        return;
      }

      if (normalized.startsWith('DELETE FROM messages')) {
        const [conversationId] = params ?? [];
        state.messages = state.messages.filter((message) => message.conversation_id !== conversationId);
        return;
      }

      return;
    }),
    runAsync: jest.fn(async (sql: string, params?: any[]) => {
      const normalized = sql.trim();

      if (normalized.startsWith('INSERT OR REPLACE INTO settings')) {
        const [nickname, broker_host, broker_port, use_ssl, client_id] = params ?? [];
        state.settings = { nickname, broker_host, broker_port, use_ssl, client_id };
        return {};
      }

      if (normalized.startsWith('INSERT INTO conversations')) {
        const [id, name, topic, created_at] = params ?? [];
        state.conversations.push({ id, name, topic, created_at });
        return {};
      }

      if (normalized.startsWith('INSERT INTO messages')) {
        const [id, conversation_id, sender, body, direction, created_at] = params ?? [];
        state.messages.push({ id, conversation_id, sender, body, direction, created_at });
        return {};
      }

      if (normalized.startsWith('DELETE FROM conversations')) {
        const [id] = params ?? [];
        state.conversations = state.conversations.filter((conversation) => conversation.id !== id);
        if (state.foreignKeys) {
          state.messages = state.messages.filter((message) => message.conversation_id !== id);
        }
        return {};
      }

      if (normalized.startsWith('DELETE FROM messages')) {
        const [conversationId] = params ?? [];
        state.messages = state.messages.filter((message) => message.conversation_id !== conversationId);
        return {};
      }

      return {};
    }),
    getAllAsync: jest.fn(async (sql: string, params?: any[]) => {
      const normalized = sql.trim();

      if (normalized.startsWith('PRAGMA user_version')) {
        return [{ user_version: state.userVersion }];
      }

      if (normalized.startsWith('SELECT nickname')) {
        return state.settings ? [state.settings] : [];
      }

      if (normalized.startsWith('SELECT id, name, topic, created_at FROM conversations ORDER BY created_at DESC')) {
        return [...state.conversations].sort((left, right) => right.created_at.localeCompare(left.created_at));
      }

      if (normalized.startsWith('SELECT id, name, topic, created_at FROM conversations WHERE id = ?')) {
        return state.conversations.filter((conversation) => conversation.id === params?.[0]);
      }

      if (normalized.startsWith('SELECT id FROM conversations WHERE topic = ?')) {
        return state.conversations
          .filter((conversation) => conversation.topic === params?.[0])
          .map((conversation) => ({ id: conversation.id }));
      }

      if (normalized.startsWith('SELECT id, name, topic, created_at FROM conversations WHERE topic = ?')) {
        return state.conversations.filter((conversation) => conversation.topic === params?.[0]);
      }

      if (normalized.startsWith('SELECT id, conversation_id, sender, body, direction, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')) {
        return state.messages
          .filter((message) => message.conversation_id === params?.[0])
          .sort((left, right) => left.created_at.localeCompare(right.created_at));
      }

      return [];
    }),
  };

  const openDatabaseAsync = jest.fn(async () => db);

  return {
    __esModule: true,
    openDatabaseAsync,
    __resetMock: resetState,
    __mockDb: db,
  };
})();

jest.mock('expo-sqlite', () => mockSQLite);

const mockMqtt = (() => {
  const clients: any[] = [];
  const connect = jest.fn((url: string, options: any) => {
    const events = new EventEmitter();
    const client = {
      on: events.on.bind(events),
      publish: jest.fn((topic: string, payload: string) => {
        return undefined;
      }),
      subscribe: jest.fn((topic: string) => {
        return undefined;
      }),
      unsubscribe: jest.fn((topic: string) => {
        return undefined;
      }),
      end: jest.fn((force: boolean) => {
        events.emit('close');
      }),
      emit: (event: string, ...args: any[]) => {
        events.emit(event, ...args);
      },
    };

    clients.push(client);
    return client;
  });

  const module = connect as any;
  module.connect = connect;

  return {
    __esModule: true,
    default: module,
    __clients: clients,
  };
})();

jest.mock('mqtt', () => mockMqtt);

describe('Back-end module', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSQLite.__resetMock();
    mockSQLite.openDatabaseAsync.mockClear();
    mockSQLite.__mockDb.execAsync.mockClear();
    mockSQLite.__mockDb.getAllAsync.mockClear();
    mockMqtt.default.mockClear();
    mockMqtt.__clients.length = 0;
  });

  describe('SettingsRepository', () => {
    it('saves first settings and generates clientId', async () => {
      const { settingsRepository } = require('../repositories/settingsRepository');
      const settings = await settingsRepository.save({ nickname: 'Alice' });

      expect(settings.clientId).toBe('uuid-1');
      expect(settings.nickname).toBe('Alice');
      expect(settings.brokerHost).toBe('broker.hivemq.com');
      expect(settings.brokerPort).toBe(8884);
      expect(settings.useSsl).toBe(true);

      const loaded = await settingsRepository.get();
      expect(loaded).toEqual(settings);
    });

    it('preserves clientId on second save', async () => {
      const { settingsRepository } = require('../repositories/settingsRepository');
      await settingsRepository.save({ nickname: 'Alice' });
      const updated = await settingsRepository.save({ nickname: 'Bob' });

      expect(updated.clientId).toBe('uuid-1');
      expect(updated.nickname).toBe('Bob');
    });

    it('throws INVALID_INPUT when nickname is empty', async () => {
      const { settingsRepository } = require('../repositories/settingsRepository');
      await expect(settingsRepository.save({ nickname: '' })).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      });
    });
  });

  describe('ConversationRepository', () => {
    it('creates conversation with id and createdAt', async () => {
      const { conversationRepository } = require('../repositories/conversationRepository');
      const conversation = await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });

      expect(conversation.id).toBe('uuid-1');
      expect(conversation.createdAt).toBeTruthy();
      expect(conversation.name).toBe('Sala');
      expect(conversation.topic).toBe('sala/futebol');
    });

    it('throws TOPIC_ALREADY_EXISTS for duplicate topic', async () => {
      const { conversationRepository } = require('../repositories/conversationRepository');
      await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });

      await expect(
        conversationRepository.create({ name: 'Outra sala', topic: 'sala/futebol' })
      ).rejects.toMatchObject({ code: 'TOPIC_ALREADY_EXISTS' });
    });

    it('returns empty array when there are no conversations', async () => {
      const { conversationRepository } = require('../repositories/conversationRepository');
      const all = await conversationRepository.findAll();
      expect(all).toEqual([]);
    });

    it('returns conversations ordered by createdAt desc', async () => {
      const { conversationRepository } = require('../repositories/conversationRepository');
      await conversationRepository.create({ name: 'Sala A', topic: 'a' });
      await new Promise((resolve) => setTimeout(resolve, 1));
      await conversationRepository.create({ name: 'Sala B', topic: 'b' });

      const all = await conversationRepository.findAll();
      expect(all.map((item: any) => item.topic)).toEqual(['b', 'a']);
    });

    it('finds conversation by topic or returns null', async () => {
      const { conversationRepository } = require('../repositories/conversationRepository');
      await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });

      const found = await conversationRepository.findByTopic('sala/futebol');
      expect(found?.topic).toBe('sala/futebol');

      const notFound = await conversationRepository.findByTopic('outra');
      expect(notFound).toBeNull();
    });

    it('deletes conversation and cascades messages', async () => {
      const { conversationRepository } = require('../repositories/conversationRepository');
      const { messageRepository } = require('../repositories/messageRepository');

      const conversation = await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });
      await messageRepository.create({
        conversationId: conversation.id,
        sender: 'Alice',
        body: 'Oi',
        direction: 'sent',
      });

      await conversationRepository.delete(conversation.id);
      const messages = await messageRepository.findByConversation(conversation.id);
      expect(messages).toEqual([]);
    });
  });

  describe('MessageRepository', () => {
    it('creates message with id and createdAt', async () => {
      const { messageRepository } = require('../repositories/messageRepository');
      const message = await messageRepository.create({
        conversationId: 'conv-1',
        sender: 'Alice',
        body: 'Oi',
        direction: 'sent',
      });

      expect(message.id).toBe('uuid-1');
      expect(message.createdAt).toBeTruthy();
      expect(message.conversationId).toBe('conv-1');
      expect(message.direction).toBe('sent');
    });

    it('returns messages ordered by createdAt asc', async () => {
      const { messageRepository } = require('../repositories/messageRepository');
      await messageRepository.create({
        conversationId: 'conv-1',
        sender: 'Alice',
        body: 'Primeira',
        direction: 'sent',
      });
      await new Promise((resolve) => setTimeout(resolve, 1));
      await messageRepository.create({
        conversationId: 'conv-1',
        sender: 'Alice',
        body: 'Segunda',
        direction: 'sent',
      });

      const messages = await messageRepository.findByConversation('conv-1');
      expect(messages.map((message: { body: string }) => message.body)).toEqual(['Primeira', 'Segunda']);
    });

    it('deleteByConversation removes all messages from conversation', async () => {
      const { messageRepository } = require('../repositories/messageRepository');
      const { conversationRepository } = require('../repositories/conversationRepository');

      const conversation = await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });
      await messageRepository.create({
        conversationId: conversation.id,
        sender: 'Alice',
        body: 'Mensagem 1',
        direction: 'sent',
      });
      await messageRepository.create({
        conversationId: conversation.id,
        sender: 'Bob',
        body: 'Mensagem 2',
        direction: 'received',
      });

      await messageRepository.deleteByConversation(conversation.id);
      const messages = await messageRepository.findByConversation(conversation.id);
      expect(messages).toEqual([]);
    });

    it('deleteByConversation preserves the conversation', async () => {
      const { messageRepository } = require('../repositories/messageRepository');
      const { conversationRepository } = require('../repositories/conversationRepository');

      const conversation = await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });
      await messageRepository.create({
        conversationId: conversation.id,
        sender: 'Alice',
        body: 'Mensagem',
        direction: 'sent',
      });

      await messageRepository.deleteByConversation(conversation.id);
      const found = await conversationRepository.findById(conversation.id);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(conversation.id);
      expect(found?.topic).toBe('sala/futebol');
    });

    it('deleteByConversation does not affect messages from other conversations', async () => {
      const { messageRepository } = require('../repositories/messageRepository');
      const { conversationRepository } = require('../repositories/conversationRepository');

      const conv1 = await conversationRepository.create({ name: 'Sala 1', topic: 'sala/1' });
      const conv2 = await conversationRepository.create({ name: 'Sala 2', topic: 'sala/2' });

      await messageRepository.create({
        conversationId: conv1.id,
        sender: 'Alice',
        body: 'Mensagem 1',
        direction: 'sent',
      });
      await messageRepository.create({
        conversationId: conv2.id,
        sender: 'Bob',
        body: 'Mensagem 2',
        direction: 'received',
      });

      await messageRepository.deleteByConversation(conv1.id);
      const messagesConv2 = await messageRepository.findByConversation(conv2.id);
      expect(messagesConv2).toHaveLength(1);
      expect(messagesConv2[0].body).toBe('Mensagem 2');
    });

    it('deleteByConversation is idempotent (no error when called twice)', async () => {
      const { messageRepository } = require('../repositories/messageRepository');
      const { conversationRepository } = require('../repositories/conversationRepository');

      const conversation = await conversationRepository.create({ name: 'Sala', topic: 'sala/futebol' });
      await messageRepository.create({
        conversationId: conversation.id,
        sender: 'Alice',
        body: 'Mensagem',
        direction: 'sent',
      });

      await messageRepository.deleteByConversation(conversation.id);
      await expect(messageRepository.deleteByConversation(conversation.id)).resolves.toBeUndefined();
    });
  });

  describe('MqttService', () => {
    it('connects successfully and reports connected status', async () => {
      const { mqttService } = require('../services/mqttService');
      const mqtt = require('mqtt');

      const connectPromise = mqttService.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-1',
      });

      const client = mqtt.__clients[0];
      setTimeout(() => client.emit('connect'));
      await expect(connectPromise).resolves.toBeUndefined();
      expect(mqttService.getStatus()).toBe('connected');
      expect(mqtt.default).toHaveBeenCalledTimes(1);
    });

    it('rejects connect when initial error occurs', async () => {
      const { mqttService } = require('../services/mqttService');
      const mqtt = require('mqtt');

      const connectPromise = mqttService.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-1',
      });

      const client = mqtt.__clients[0];
      setTimeout(() => client.emit('error', new Error('failure')));
      await expect(connectPromise).rejects.toMatchObject({ code: 'CONNECTION_FAILED' });
    });

    it('subscribes and unsubscribes using the client', async () => {
      const { mqttService } = require('../services/mqttService');
      const mqtt = require('mqtt');

      const connectPromise = mqttService.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-1',
      });
      const client = mqtt.__clients[0];
      setTimeout(() => client.emit('connect'));
      await connectPromise;

      mqttService.subscribe('sala/futebol');
      mqttService.unsubscribe('sala/futebol');

      expect(client.subscribe).toHaveBeenCalledWith('sala/futebol');
      expect(client.unsubscribe).toHaveBeenCalledWith('sala/futebol');
    });

    it('publishes serialized payload to the client', async () => {
      const { mqttService } = require('../services/mqttService');
      const mqtt = require('mqtt');

      const connectPromise = mqttService.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-1',
      });
      const client = mqtt.__clients[0];
      setTimeout(() => client.emit('connect'));
      await connectPromise;

      const payload = {
        clientId: 'client-1',
        sender: 'Alice',
        body: 'Oi',
        sentAt: '2026-06-04T10:00:00.000Z',
      };

      mqttService.publish('sala/futebol', payload);
      expect(client.publish).toHaveBeenCalledWith('sala/futebol', JSON.stringify(payload));
    });

    it('delivers valid JSON messages and ignores invalid JSON', async () => {
      const { mqttService } = require('../services/mqttService');
      const mqtt = require('mqtt');

      const connectPromise = mqttService.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-1',
      });
      const client = mqtt.__clients[0];
      client.emit('connect');
      await connectPromise;

      const onMessage = jest.fn();
      mqttService.onMessage(onMessage);

      const payload = {
        clientId: 'client-1',
        sender: 'Alice',
        body: 'Oi',
        sentAt: '2026-06-04T10:00:00.000Z',
      };

      client.emit('message', 'sala/futebol', Buffer.from(JSON.stringify(payload)));
      client.emit('message', 'sala/futebol', Buffer.from('not-json'));

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(onMessage).toHaveBeenCalledWith('sala/futebol', payload);
    });

    it('notifies status changes and cancellation works', async () => {
      const { mqttService } = require('../services/mqttService');
      const mqtt = require('mqtt');

      const connectPromise = mqttService.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-1',
      });
      const client = mqtt.__clients[0];
      client.emit('connect');
      await connectPromise;

      const onStatus = jest.fn();
      const unsubscribe = mqttService.onStatusChange(onStatus);

      client.emit('close');
      expect(onStatus).toHaveBeenCalledWith('disconnected');

      unsubscribe();
      client.emit('connect');
      expect(onStatus).toHaveBeenCalledTimes(1);
    });
  });
});
