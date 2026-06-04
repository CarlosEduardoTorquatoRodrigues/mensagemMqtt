import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'mensagem-mqtt.db';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  nickname    TEXT    NOT NULL,
  broker_host TEXT    NOT NULL,
  broker_port INTEGER NOT NULL,
  use_ssl     INTEGER NOT NULL DEFAULT 1,
  client_id   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  topic      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender          TEXT NOT NULL,
  body            TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  created_at      TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id);
`;

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function createSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA);
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync('PRAGMA foreign_keys = ON');
      const rows = await db.getAllAsync<{ user_version: number }>('PRAGMA user_version');
      if (rows[0]?.user_version === 0) {
        await createSchema(db);
        await db.execAsync('PRAGMA user_version = 1');
      }
      return db;
    });
  }

  const db = await databasePromise;
  await db.execAsync('PRAGMA foreign_keys = ON');
  return db;
}
