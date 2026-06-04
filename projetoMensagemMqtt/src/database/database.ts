import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'mensagemmqtt.db';
const SCHEMA_VERSION = 1;

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function ensureSchema(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const rows = await db.getAllAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const currentVersion = rows?.[0]?.user_version ?? 0;
  if (currentVersion !== 0) {
    return;
  }

  await db.execAsync(`CREATE TABLE IF NOT EXISTS settings (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    nickname    TEXT    NOT NULL,
    broker_host TEXT    NOT NULL,
    broker_port INTEGER NOT NULL,
    use_ssl     INTEGER NOT NULL DEFAULT 1,
    client_id   TEXT    NOT NULL
  );`);

  await db.execAsync(`CREATE TABLE IF NOT EXISTS conversations (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    topic      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );`);

  await db.execAsync(`CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender          TEXT NOT NULL,
    body            TEXT NOT NULL,
    direction       TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
    created_at      TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );`);

  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id);`);

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DB_NAME).then(async (db) => {
      await ensureSchema(db);
      return db;
    });
  }
  return databasePromise;
}
