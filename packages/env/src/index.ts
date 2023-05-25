import { log } from 'log'
import path from 'path'
import { z } from 'zod'

const ROOT_DIR = path.resolve(path.join(__dirname, '../../..'))

const zPath = z.string().transform((val) => (path.isAbsolute(val) ? val : path.join(ROOT_DIR, val)))

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  SERVER_HOST: z.string(),
  SERVER_PORT: z.coerce.number(),
  DATABASE_URL: zPath,
  DOWNLOAD_DIR: zPath,
  MUSIC_DIR: zPath,
  IMAGES_DIR: zPath,
  TRANSCODES_DIR: zPath,
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
  DOWNLOADER_CONCURRENCY: z.coerce.number().min(1).optional(),
})

const envRes = envSchema.safeParse(process.env)

if (!envRes.success) {
  log.error(envRes, '❌ Invalid environment variables')
  process.exit(1)
}

export const env = envRes.data
