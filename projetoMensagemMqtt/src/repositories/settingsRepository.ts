import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';
import { AppError, Settings, UpdateSettingsInput } from '../types';
import { DEFAULT_BROKER } from '../config';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code, message });
}

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(input: UpdateSettingsInput): Promise<Settings>;
}

export const settingsRepository: SettingsRepository = {
  async get() {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      nickname: string;
      broker_host: string;
      broker_port: number;
      use_ssl: number;
      client_id: string;
    }>('SELECT nickname, broker_host, broker_port, use_ssl, client_id FROM settings LIMIT 1');

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    return {
      nickname: row.nickname,
      brokerHost: row.broker_host,
      brokerPort: row.broker_port,
      useSsl: row.use_ssl === 1,
      clientId: row.client_id,
    };
  },

  async save(input) {
    const database = await getDatabase();
    const current = await this.get();

    const merged: Settings = {
      nickname: input.nickname ?? current?.nickname ?? '',
      brokerHost: input.brokerHost ?? current?.brokerHost ?? DEFAULT_BROKER.host,
      brokerPort: input.brokerPort ?? current?.brokerPort ?? DEFAULT_BROKER.port,
      useSsl: input.useSsl ?? current?.useSsl ?? DEFAULT_BROKER.useSsl,
      clientId: current?.clientId ?? Crypto.randomUUID(),
    };

    if (!merged.nickname.trim() || !merged.brokerHost.trim() || !merged.brokerPort) {
      throw createAppError('INVALID_INPUT', 'nickname, brokerHost and brokerPort are required');
    }

    const useSslInteger = merged.useSsl ? 1 : 0;

    if (current) {
      await database.runAsync(
        'UPDATE settings SET nickname = ?, broker_host = ?, broker_port = ?, use_ssl = ?, client_id = ? WHERE id = 1',
        merged.nickname,
        merged.brokerHost,
        merged.brokerPort,
        useSslInteger,
        merged.clientId,
      );
    } else {
      await database.runAsync(
        'INSERT INTO settings (id, nickname, broker_host, broker_port, use_ssl, client_id) VALUES (1, ?, ?, ?, ?, ?)',
        merged.nickname,
        merged.brokerHost,
        merged.brokerPort,
        useSslInteger,
        merged.clientId,
      );
    }

    return merged;
  },
};
