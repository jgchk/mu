import { Database } from 'db'

import { env } from '../env'

export const db = new Database(env.DATABASE_URL)
