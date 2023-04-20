import { Database } from 'db'

import { env } from '../env'

export const makeDb = () => Database(env.DATABASE_URL)
