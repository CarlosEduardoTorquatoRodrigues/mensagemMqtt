import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'app.db';
const SCHEMA_SCRIPT = `CREATE TABLE IF NOT EXISTS settings (
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

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync('PRAGMA foreign_keys = ON');
      const rows = await database.getAllAsync<{ user_version: number }>('PRAGMA user_version');
      const currentVersion = rows.length > 0 ? rows[0].user_version : 0;

      if (currentVersion === 0) {
        await database.execAsync(SCHEMA_SCRIPT);
        await database.execAsync('PRAGMA user_version = 1');
      }

      return database;
    });
  }

  return databasePromise;
}
