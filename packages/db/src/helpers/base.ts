import type { Database } from 'better-sqlite3'
import SqliteDatabase from 'better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { migrate } from '../migrate'
import * as schema from '../schema'

export class DatabaseBase {
  sqlite: Database
  db: BetterSQLite3Database<typeof schema>

  constructor(url: string, log = false) {
    this.sqlite = new SqliteDatabase(url)
    this.db = drizzle(this.sqlite, { schema, logger: log })
    migrate(this.db)
  }

  close() {
    this.sqlite.close()
  }
}
