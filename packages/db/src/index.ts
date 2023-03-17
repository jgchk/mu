import SqliteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { migrate } from './migrate';

export type Database = ReturnType<typeof getDb>;

export const getDb = (url: string) => {
  const sqlite = new SqliteDatabase(url);
  const db = drizzle(sqlite);
  migrate(db);
  return db;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

export const db = getDb(databaseUrl);

export * from './operations';
export * from './schema';
