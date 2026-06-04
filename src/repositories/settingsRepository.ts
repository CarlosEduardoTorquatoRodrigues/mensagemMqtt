import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';
import { DEFAULT_BROKER } from '../config';
import {
  AppError,
  Settings,
  UpdateSettingsInput,
} from '../types';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code });
}

function toSettings(row: {
  nickname: string;
  broker_host: string;
  broker_port: number;
  use_ssl: number;
  client_id: string;
}): Settings {
  return {
    nickname: row.nickname,
    brokerHost: row.broker_host,
    brokerPort: row.broker_port,
    useSsl: row.use_ssl === 1,
    clientId: row.client_id,
  };
}

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(input: UpdateSettingsInput): Promise<Settings>;
}

export const settingsRepository: SettingsRepository = {
  async get(): Promise<Settings | null> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      nickname: string;
      broker_host: string;
      broker_port: number;
      use_ssl: number;
      client_id: string;
    }>(
      'SELECT nickname, broker_host, broker_port, use_ssl, client_id FROM settings WHERE id = 1'
    );

    if (rows.length === 0) {
      return null;
    }

    return toSettings(rows[0]);
  },

  async save(input: UpdateSettingsInput): Promise<Settings> {
    const current = await this.get();
    const merged: Settings = {
      nickname: input.nickname ?? current?.nickname ?? '',
      brokerHost: input.brokerHost ?? current?.brokerHost ?? DEFAULT_BROKER.host,
      brokerPort: input.brokerPort ?? current?.brokerPort ?? DEFAULT_BROKER.port,
      useSsl: input.useSsl ?? current?.useSsl ?? DEFAULT_BROKER.useSsl,
      clientId: current?.clientId ?? Crypto.randomUUID(),
    };

    if (!merged.nickname.trim() || !merged.brokerHost.trim() || !merged.brokerPort) {
      throw createAppError('INVALID_INPUT', 'Configuração inválida');
    }

    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (id, nickname, broker_host, broker_port, use_ssl, client_id) VALUES (1, ?, ?, ?, ?, ?)',
      [
        merged.nickname,
        merged.brokerHost,
        merged.brokerPort,
        merged.useSsl ? 1 : 0,
        merged.clientId,
      ]
    );

    return merged;
  },
};
