import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';
import {
  AppError,
  CreateMessageInput,
  Message,
} from '../types';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code });
}

function toMessage(row: {
  id: string;
  conversation_id: string;
  sender: string;
  body: string;
  direction: 'sent' | 'received';
  created_at: string;
}): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    body: row.body,
    direction: row.direction,
    createdAt: row.created_at,
  };
}

export interface MessageRepository {
  create(input: CreateMessageInput): Promise<Message>;
  findByConversation(conversationId: string): Promise<Message[]>;
  deleteByConversation(conversationId: string): Promise<void>;
}

export const messageRepository: MessageRepository = {
  async create(input: CreateMessageInput): Promise<Message> {
    const db = await getDatabase();
    const message: Message = {
      id: Crypto.randomUUID(),
      conversationId: input.conversationId,
      sender: input.sender,
      body: input.body,
      direction: input.direction,
      createdAt: new Date().toISOString(),
    };

    await db.runAsync(
      'INSERT INTO messages (id, conversation_id, sender, body, direction, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        message.id,
        message.conversationId,
        message.sender,
        message.body,
        message.direction,
        message.createdAt,
      ]
    );

    return message;
  },

  async findByConversation(conversationId: string): Promise<Message[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      conversation_id: string;
      sender: string;
      body: string;
      direction: 'sent' | 'received';
      created_at: string;
    }>(
      'SELECT id, conversation_id, sender, body, direction, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    return rows.map(toMessage);
  },

  async deleteByConversation(conversationId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);
  },
};
