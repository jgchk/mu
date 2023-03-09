import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { env } from '../env'
import { migrate } from './migrate'

const sqlite = new Database(env.DATABASE_URL)
export const db = drizzle(sqlite)

migrate(db)
