import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database/database';
import { DEFAULT_BROKER } from '../config';
import {
  AppError,
  Settings,
  UpdateSettingsInput,
} from '../types';

function createAppError(code: AppError['code'], message: string) {
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
    useSsl: Boolean(row.use_ssl),
    clientId: row.client_id,
  };
}

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(input: UpdateSettingsInput): Promise<Settings>;
}

export class SettingsRepositoryImpl implements SettingsRepository {
  async get(): Promise<Settings | null> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      nickname: string;
      broker_host: string;
      broker_port: number;
      use_ssl: number;
      client_id: string;
    }>('SELECT nickname, broker_host, broker_port, use_ssl, client_id FROM settings WHERE id = ?;', 1);

    if (!rows.length) {
      return null;
    }

    return toSettings(rows[0]);
  }

  async save(input: UpdateSettingsInput): Promise<Settings> {
    const db = await getDatabase();
    const existing = await this.get();

    const merged: Settings = {
      nickname: input.nickname ?? existing?.nickname ?? '',
      brokerHost: input.brokerHost ?? existing?.brokerHost ?? DEFAULT_BROKER.host,
      brokerPort: input.brokerPort ?? existing?.brokerPort ?? DEFAULT_BROKER.port,
      useSsl: input.useSsl ?? existing?.useSsl ?? DEFAULT_BROKER.useSsl,
      clientId: existing?.clientId ?? randomUUID(),
    };

    if (!merged.nickname.trim() || !merged.brokerHost.trim() || !merged.brokerPort) {
      throw createAppError(
        'INVALID_INPUT',
        'Nickname, broker host and broker port are required.',
      );
    }

    if (existing) {
      await db.runAsync(
        'UPDATE settings SET nickname = ?, broker_host = ?, broker_port = ?, use_ssl = ?, client_id = ? WHERE id = ?;',
        merged.nickname,
        merged.brokerHost,
        merged.brokerPort,
        Number(merged.useSsl),
        merged.clientId,
        1,
      );
    } else {
      await db.runAsync(
        'INSERT INTO settings (id, nickname, broker_host, broker_port, use_ssl, client_id) VALUES (1, ?, ?, ?, ?, ?);',
        merged.nickname,
        merged.brokerHost,
        merged.brokerPort,
        Number(merged.useSsl),
        merged.clientId,
      );
    }

    return merged;
  }
}
