import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { UpdateData } from '../utils'
import type { DatabaseBase } from './base'

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

  soundcloudAuthToken: text('soundcloud_auth_token'),
})

export const defaultConfig: Omit<Config, 'id'> = {
  lastFmKey: null,
  lastFmSecret: null,
  lastFmUsername: null,
  lastFmPassword: null,
  soulseekUsername: null,
  soulseekPassword: null,
  spotifyClientId: null,
  spotifyClientSecret: null,
  spotifyUsername: null,
  spotifyPassword: null,
  spotifyDcCookie: null,
  soundcloudAuthToken: null,
}

export type ConfigMixin = {
  config: {
    get: () => Omit<Config, 'id'>
    update: (data: UpdateData<InsertConfig>) => Config
  }
}

export const ConfigMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<ConfigMixin> & TBase =>
  class extends Base implements ConfigMixin {
    config: ConfigMixin['config'] = {
      get: () => {
        return this.db.select().from(configs).limit(1).all().at(0) ?? defaultConfig
      },

      update: (data) => {
        const config = this.config.get()
        if ('id' in config) {
          const update = {
            ...(data.lastFmKey !== undefined ? { lastFmKey: data.lastFmKey } : {}),
            ...(data.lastFmSecret !== undefined ? { lastFmSecret: data.lastFmSecret } : {}),
            ...(data.lastFmUsername !== undefined ? { lastFmUsername: data.lastFmUsername } : {}),
            ...(data.lastFmPassword !== undefined ? { lastFmPassword: data.lastFmPassword } : {}),
            ...(data.soulseekUsername !== undefined
              ? { soulseekUsername: data.soulseekUsername }
              : {}),
            ...(data.soulseekPassword !== undefined
              ? { soulseekPassword: data.soulseekPassword }
              : {}),
            ...(data.spotifyClientId !== undefined
              ? { spotifyClientId: data.spotifyClientId }
              : {}),
            ...(data.spotifyClientSecret !== undefined
              ? { spotifyClientSecret: data.spotifyClientSecret }
              : {}),
            ...(data.spotifyUsername !== undefined
              ? { spotifyUsername: data.spotifyUsername }
              : {}),
            ...(data.spotifyPassword !== undefined
              ? { spotifyPassword: data.spotifyPassword }
              : {}),
            ...(data.spotifyDcCookie !== undefined
              ? { spotifyDcCookie: data.spotifyDcCookie }
              : {}),
            ...(data.soundcloudAuthToken !== undefined
              ? { soundcloudAuthToken: data.soundcloudAuthToken }
              : {}),
          }
          return this.db.update(configs).set(update).returning().get()
        } else {
          const insert: InsertConfig = {
            lastFmKey: data.lastFmKey ?? defaultConfig.lastFmKey,
            lastFmSecret: data.lastFmSecret ?? defaultConfig.lastFmSecret,
            lastFmUsername: data.lastFmUsername ?? defaultConfig.lastFmUsername,
            lastFmPassword: data.lastFmPassword ?? defaultConfig.lastFmPassword,
            soulseekUsername: data.soulseekUsername ?? defaultConfig.soulseekUsername,
            soulseekPassword: data.soulseekPassword ?? defaultConfig.soulseekPassword,
            spotifyClientId: data.spotifyClientId ?? defaultConfig.spotifyClientId,
            spotifyClientSecret: data.spotifyClientSecret ?? defaultConfig.spotifyClientSecret,
            spotifyUsername: data.spotifyUsername ?? defaultConfig.spotifyUsername,
            spotifyPassword: data.spotifyPassword ?? defaultConfig.spotifyPassword,
            spotifyDcCookie: data.spotifyDcCookie ?? defaultConfig.spotifyDcCookie,
            soundcloudAuthToken: data.soundcloudAuthToken ?? defaultConfig.soundcloudAuthToken,
          }
          return this.db.insert(configs).values(insert).returning().get()
        }
      },
    }
  }
