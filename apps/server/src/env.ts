import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),
  DOWNLOAD_DIR: z.string(),
  MUSIC_DIR: z.string(),
  SOUNDCLOUD_AUTH_TOKEN: z.string(),
  SOUNDCLOUD_CLIENT_ID: z.string(),
  SPOTIFY_CLIENT_ID: z.string(),
  SPOTIFY_CLIENT_SECRET: z.string(),
  SPOTIFY_USERNAME: z.string(),
  SPOTIFY_PASSWORD: z.string(),
  SOULSEEK_USERNAME: z.string(),
  SOULSEEK_PASSWORD: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('production'),
})

const envRes = envSchema.safeParse(process.env)

if (!envRes.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envRes.error.format(), null, 4))
  process.exit(1)
}

export const env = envRes.data
