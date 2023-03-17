import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

import drizzleConfig from '../drizzle.config.json';
import type { Database } from '.';

export const migrate = (db: Database) =>
  drizzleMigrate(db, { migrationsFolder: path.join(__dirname, '../', drizzleConfig.out) });
