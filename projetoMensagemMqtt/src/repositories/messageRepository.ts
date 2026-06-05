import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';
import { CreateMessageInput, Message } from '../types';

export interface MessageRepository {
  create(input: CreateMessageInput): Promise<Message>;
  findByConversation(conversationId: string): Promise<Message[]>;
  deleteByConversation(conversationId: string): Promise<void>;
}

export const messageRepository: MessageRepository = {
  async create(input) {
    const database = await getDatabase();
    const message: Message = {
      id: Crypto.randomUUID(),
      conversationId: input.conversationId,
      sender: input.sender,
      body: input.body,
      direction: input.direction,
      createdAt: new Date().toISOString(),
    };

    await database.runAsync(
      'INSERT INTO messages (id, conversation_id, sender, body, direction, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      message.id,
      message.conversationId,
      message.sender,
      message.body,
      message.direction,
      message.createdAt,
    );

    return message;
  },

  async findByConversation(conversationId) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      id: string;
      conversation_id: string;
      sender: string;
      body: string;
      direction: string;
      created_at: string;
    }>('SELECT id, conversation_id, sender, body, direction, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', conversationId);

    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      sender: row.sender,
      body: row.body,
      direction: row.direction as 'sent' | 'received',
      createdAt: row.created_at,
    }));
  },

  async deleteByConversation(conversationId) {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM messages WHERE conversation_id = ?', conversationId);
  },
};
