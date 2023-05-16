import { Downloader } from 'downloader'
import { env } from 'env'
import { ImageManager } from 'image-manager'
import { log } from 'log'

import { makeLastFmContext } from './slices/last-fm'
import { makeSoulseekContext } from './slices/soulseek'
import { makeSoundcloudContext } from './slices/soundcloud'
import { makeSpotifyContext } from './slices/spotify'
import type { SystemContext } from './types'
import { makeDb, setConfigFromEnv } from './utils'

export type Setter = (update: Partial<SystemContext>) => void
export type Getter = () => SystemContext

export const makeContext = async (): Promise<() => SystemContext> => {
  const db = makeDb()
  const config = setConfigFromEnv(db)

  const set: Setter = (update) => {
    ctx = { ...ctx, ...update }
    console.log('ayoooo', ctx.slsk.status)
  }

  const get: Getter = () => ctx

  let ctx: SystemContext = {
    db,
    dl: new Downloader({
      getContext: () => ({ db, lfm: ctx.lfm, slsk: ctx.slsk, sc: ctx.sc, sp: ctx.sp }),
      downloadDir: env.DOWNLOAD_DIR,
      logger: log,
      concurrency: config.downloaderConcurrency,
    }),
    img: new ImageManager({ imagesDir: env.IMAGES_DIR, db }),

    ...makeLastFmContext(set, get),
    ...makeSoulseekContext(set, get),
    ...makeSoundcloudContext(set, get),
    ...makeSpotifyContext(set, get),

    destroy: () => {
      db.close()
      ctx.dl.close()
      if (ctx.slsk.status === 'logging-in' || ctx.slsk.status === 'logged-in') {
        ctx.slsk.client.destroy()
      }
    },
  }

  await Promise.all([
    ctx.startLastFm(),
    ...(env.NODE_ENV === 'production' ? [ctx.startSoulseek()] : []),
    ctx.startSoundcloud(),
    ctx.startSpotify(),
  ])

  return () => ctx
}
