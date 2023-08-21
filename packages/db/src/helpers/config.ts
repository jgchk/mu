import { withProps } from 'utils'

import type { Config, InsertConfig } from '../schema/config'
import { configs } from '../schema/config'
import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'

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
  downloaderConcurrency: 1,
}

export type ConfigMixin = {
  config: {
    get: () => Omit<Config, 'id'>
    update: (data: UpdateData<InsertConfig>) => Omit<Config, 'id'>
  }
}

export const ConfigMixin = <T extends DatabaseBase>(base: T): T & ConfigMixin => {
  const configMixin: ConfigMixin['config'] = {
    get: () => {
      return base.db.select().from(configs).limit(1).all().at(0) ?? defaultConfig
    },

    update: (data) => {
      const config = configMixin.get()
      if ('id' in config) {
        const update = makeUpdate(data)
        if (!hasUpdate(update)) return configMixin.get()
        return base.db.update(configs).set(update).returning().get()
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
        return base.db.insert(configs).values(insert).returning().get()
      }
    },
  }

  return withProps(base, { config: configMixin })
}
