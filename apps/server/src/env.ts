import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  SERVER_PORT: z.coerce.number(),
  DATABASE_URL: z.string(),
  DOWNLOAD_DIR: z.string(),
  MUSIC_DIR: z.string(),
  IMAGES_DIR: z.string(),
  SOUNDCLOUD_AUTH_TOKEN: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_USERNAME: z.string().optional(),
  SPOTIFY_PASSWORD: z.string().optional(),
  SPOTIFY_DC_COOKIE: z.string().optional(),
  SOULSEEK_USERNAME: z.string().optional(),
  SOULSEEK_PASSWORD: z.string().optional(),
  LASTFM_KEY: z.string().optional(),
  LASTFM_SECRET: z.string().optional(),
  LASTFM_USERNAME: z.string().optional(),
  LASTFM_PASSWORD: z.string().optional(),
})

const envRes = envSchema.safeParse(process.env)

if (!envRes.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envRes.error.format(), null, 4))
  process.exit(1)
}

export const env = envRes.data
