import { Database } from 'db'

import { env } from '../env'

export const makeDb = () => new Database(env.DATABASE_URL)
