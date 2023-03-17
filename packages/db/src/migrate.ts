import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import { Database } from '.';
import path from 'path';

import drizzleConfig from '../drizzle.config.json';

export const migrate = (db: Database) =>
  drizzleMigrate(db, { migrationsFolder: path.join(__dirname, '../', drizzleConfig.out) });
