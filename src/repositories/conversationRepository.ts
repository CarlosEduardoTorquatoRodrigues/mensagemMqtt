import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';
import {
  AppError,
  Conversation,
  CreateConversationInput,
} from '../types';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code });
}

function toConversation(row: {
  id: string;
  name: string;
  topic: string;
  created_at: string;
}): Conversation {
  return {
    id: row.id,
    name: row.name,
    topic: row.topic,
    createdAt: row.created_at,
  };
}

export interface ConversationRepository {
  create(input: CreateConversationInput): Promise<Conversation>;
  findAll(): Promise<Conversation[]>;
  findById(id: string): Promise<Conversation | null>;
  findByTopic(topic: string): Promise<Conversation | null>;
  delete(id: string): Promise<void>;
}

export const conversationRepository: ConversationRepository = {
  async create(input: CreateConversationInput): Promise<Conversation> {
    const db = await getDatabase();
    const existing = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM conversations WHERE topic = ?',
      [input.topic]
    );

    if (existing.length > 0) {
      throw createAppError('TOPIC_ALREADY_EXISTS', 'O tópico já existe');
    }

    const conversation: Conversation = {
      id: Crypto.randomUUID(),
      name: input.name,
      topic: input.topic,
      createdAt: new Date().toISOString(),
    };

    await db.runAsync(
      'INSERT INTO conversations (id, name, topic, created_at) VALUES (?, ?, ?, ?)',
      [conversation.id, conversation.name, conversation.topic, conversation.createdAt]
    );

    return conversation;
  },

  async findAll(): Promise<Conversation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      topic: string;
      created_at: string;
    }>('SELECT id, name, topic, created_at FROM conversations ORDER BY created_at DESC');

    return rows.map(toConversation);
  },

  async findById(id: string): Promise<Conversation | null> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      topic: string;
      created_at: string;
    }>('SELECT id, name, topic, created_at FROM conversations WHERE id = ?', [id]);

    if (rows.length === 0) {
      return null;
    }

    return toConversation(rows[0]);
  },

  async findByTopic(topic: string): Promise<Conversation | null> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      topic: string;
      created_at: string;
    }>('SELECT id, name, topic, created_at FROM conversations WHERE topic = ?', [topic]);

    if (rows.length === 0) {
      return null;
    }

    return toConversation(rows[0]);
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM conversations WHERE id = ?', [id]);
  },
};
