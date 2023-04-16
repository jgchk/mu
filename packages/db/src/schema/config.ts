import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type Config = InferModel<typeof configs>
export type InsertConfig = InferModel<typeof configs, 'insert'>
export const configs = sqliteTable('config', {
  id: integer('id').primaryKey(),
  lastFmKey: text('last_fm_key'),
  lastFmSecret: text('last_fm_secret'),
  lastFmUsername: text('last_fm_username'),
  lastFmPassword: text('last_fm_password'),
  soulseekUsername: text('soulseek_username'),
  soulseekPassword: text('soulseek_password'),
  spotifyClientId: text('spotify_client_id'),
  spotifyClientSecret: text('spotify_client_secret'),
  spotifyUsername: text('spotify_username'),
  spotifyPassword: text('spotify_password'),
  spotifyDcCookie: text('spotify_dc_cookie'),
})
