import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'

import drizzleConfig from '../drizzle.config.json'

const migrationsFolder = path.resolve(path.join(__dirname, '../', drizzleConfig.out))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const migrate = <D extends BetterSQLite3Database<any>>(db: D) =>
  drizzleMigrate(db, { migrationsFolder })
