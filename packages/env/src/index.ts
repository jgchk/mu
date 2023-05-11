import { log } from 'log'
import path from 'path'
import { z } from 'zod'

const ROOT_DIR = path.resolve(path.join(__dirname, '../../..'))

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  SERVER_HOST: z.string(),
  SERVER_PORT: z.coerce.number(),
  DATABASE_URL: z
    .string()
    .transform((val) => (path.isAbsolute(val) ? val : path.join(ROOT_DIR, val))),
  DOWNLOAD_DIR: z
    .string()
    .transform((val) => (path.isAbsolute(val) ? val : path.join(ROOT_DIR, val))),
  MUSIC_DIR: z.string().transform((val) => (path.isAbsolute(val) ? val : path.join(ROOT_DIR, val))),
  IMAGES_DIR: z
    .string()
    .transform((val) => (path.isAbsolute(val) ? val : path.join(ROOT_DIR, val))),
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
