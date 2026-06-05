import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';
import { AppError, Conversation, CreateConversationInput } from '../types';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code, message });
}

export interface ConversationRepository {
  create(input: CreateConversationInput): Promise<Conversation>;
  findAll(): Promise<Conversation[]>;
  findById(id: string): Promise<Conversation | null>;
  findByTopic(topic: string): Promise<Conversation | null>;
  delete(id: string): Promise<void>;
  rename(id: string, name: string): Promise<Conversation>;
}

export const conversationRepository: ConversationRepository = {
  async create(input) {
    const database = await getDatabase();
    const existing = await database.getAllAsync<{ id: string }>('SELECT id FROM conversations WHERE topic = ? LIMIT 1', input.topic);

    if (existing.length > 0) {
      throw createAppError('TOPIC_ALREADY_EXISTS', `Topic ${input.topic} already exists`);
    }

    const conversation: Conversation = {
      id: Crypto.randomUUID(),
      name: input.name,
      topic: input.topic,
      createdAt: new Date().toISOString(),
    };

    await database.runAsync(
      'INSERT INTO conversations (id, name, topic, created_at) VALUES (?, ?, ?, ?)',
      conversation.id,
      conversation.name,
      conversation.topic,
      conversation.createdAt,
    );

    return conversation;
  },

  async findAll() {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      id: string;
      name: string;
      topic: string;
      created_at: string;
    }>('SELECT id, name, topic, created_at FROM conversations ORDER BY created_at DESC');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      topic: row.topic,
      createdAt: row.created_at,
    }));
  },

  async findById(id) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      id: string;
      name: string;
      topic: string;
      created_at: string;
    }>('SELECT id, name, topic, created_at FROM conversations WHERE id = ? LIMIT 1', id);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      topic: row.topic,
      createdAt: row.created_at,
    };
  },

  async findByTopic(topic) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      id: string;
      name: string;
      topic: string;
      created_at: string;
    }>('SELECT id, name, topic, created_at FROM conversations WHERE topic = ? LIMIT 1', topic);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      topic: row.topic,
      createdAt: row.created_at,
    };
  },

  async delete(id) {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM conversations WHERE id = ?', id);
  },

  async rename(id, name) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw createAppError('INVALID_INPUT', 'Conversation name cannot be empty');
    }

    const database = await getDatabase();
    const existing = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM conversations WHERE id = ? LIMIT 1',
      id,
    );

    if (existing.length === 0) {
      throw createAppError('INVALID_INPUT', `Conversation with id ${id} not found`);
    }

    await database.runAsync('UPDATE conversations SET name = ? WHERE id = ?', trimmedName, id);

    const updated = await this.findById(id);
    return updated!;
  },
};
