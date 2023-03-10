import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string(),
  SERVER_PORT: z.coerce.number(),
  MUSIC_DIR: z.string(),
  SOUNDCLOUD_CLIENT_ID: z.string(),
  SOUNDCLOUD_AUTH_TOKEN: z.string(),
})

const envRes = envSchema.safeParse(process.env)

if (!envRes.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envRes.error.format(), null, 4))
  process.exit(1)
}

export const env = envRes.data
