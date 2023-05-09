import { env } from 'env'
import { ImageManager } from 'image-manager'
import { nanoid } from 'nanoid'
import { makeDb } from 'services'
import type { ServicesRequestMap, ServicesResponseMap } from 'services'
import type { SlskClient } from 'soulseek-ts'
import superjson from 'superjson'
import type { Context } from 'trpc'
import type { IsEmptyObject } from 'utils'
import type { Worker } from 'worker_threads'

export const makeContext = async (servicesWorker: Worker): Promise<Context> => {
  const db = makeDb()

  const sendServicesMessage = async <K extends keyof ServicesRequestMap>(
    kind: K,
    ...args: IsEmptyObject<ServicesRequestMap[K], [], [ServicesRequestMap[K]]>
  ): Promise<ServicesResponseMap[K]> =>
    new Promise((resolve, reject) => {
      const id = nanoid()

      const listener = (fromMessage_: string) => {
        const fromMessage = superjson.parse<
          { id: string; data: ServicesResponseMap[K] } | { id: string; error: unknown }
        >(fromMessage_)
        if (fromMessage.id !== id) return

        if ('error' in fromMessage) {
          servicesWorker.off('message', listener)
          reject(fromMessage.error)
        } else if ('data' in fromMessage) {
          servicesWorker.off('message', listener)
          resolve(fromMessage.data)
        }
      }

      servicesWorker.on('message', listener)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const request = args.length === 0 ? {} : (args[0] as any)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      servicesWorker.postMessage({ id, data: { kind, ...request } })
    })

  const context: Context = {
    db,
    img: new ImageManager({ imagesDir: env.IMAGES_DIR, db }),
    musicDir: env.MUSIC_DIR,
    imagesDir: env.IMAGES_DIR,

    getStatus: () => sendServicesMessage('status'),

    startSoulseek: () => sendServicesMessage('start-soulseek'),
    stopSoulseek: () => sendServicesMessage('stop-soulseek'),
    startLastFm: () => sendServicesMessage('start-last-fm'),
    stopLastFm: () => sendServicesMessage('stop-last-fm'),
    startSpotify: () => sendServicesMessage('start-spotify'),
    stopSpotify: () => sendServicesMessage('stop-spotify'),
    startSoundcloud: () => sendServicesMessage('start-soundcloud'),
    stopSoundcloud: () => sendServicesMessage('stop-soundcloud'),

    lfm: {
      getFriends: () => sendServicesMessage('get-last-fm-friends'),
      getRecentTracks: (username) => sendServicesMessage('get-last-fm-recent-tracks', { username }),
      getLovedTrack: (...params) => sendServicesMessage('get-last-fm-loved-track', { params }),
      updateNowPlaying: (...params) =>
        sendServicesMessage('update-last-fm-now-playing', { params }),
      scrobble: (...params) => sendServicesMessage('last-fm-scrobble', { params }),
      loveTrack: (...params) => sendServicesMessage('last-fm-love-track', { params }),
      unloveTrack: (...params) => sendServicesMessage('last-fm-unlove-track', { params }),
    },

    sc: {
      searchTracks: (...params) => sendServicesMessage('soundcloud-search-tracks', { params }),
      searchAlbums: (...params) => sendServicesMessage('soundcloud-search-albums', { params }),
    },

    slsk: {
      search: (...params) =>
        new Promise((resolve, reject) => {
          const id = nanoid()

          const results: Awaited<ReturnType<SlskClient['search']>> = []
          const listener = (fromMessage_: string) => {
            const fromMessage = superjson.parse<
              | { id: string; data: Awaited<ReturnType<SlskClient['search']>>[number] }
              | { id: string; error: unknown }
            >(fromMessage_)
            if (fromMessage.id !== id) return

            if ('error' in fromMessage) {
              servicesWorker.off('message', listener)
              reject(fromMessage.error)
            } else if ('data' in fromMessage) {
              params[1]?.onResult?.(fromMessage.data)
              results.push(fromMessage.data)
            } else if ('ended' in fromMessage) {
              servicesWorker.off('message', listener)
              resolve(results)
            }
          }

          servicesWorker.on('message', listener)

          servicesWorker.postMessage({
            id,
            data: { kind: 'soulseek-search', query: params[0], timeout: params[1]?.timeout },
          })
        }),
    },

    sp: {
      getFriendActivity: () => sendServicesMessage('get-spotify-friend-activity'),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
      search: (...params) => sendServicesMessage('spotify-search', { params }) as any,
    },

    download: async (dl) => {
      await sendServicesMessage('download', { dl })
    },

    destroy: async () => {
      context.db.close()
      await sendServicesMessage('destroy')
    },
  }

  await Promise.all([
    context.startLastFm(),
    ...(env.NODE_ENV === 'production' ? [context.startSoulseek()] : []),
    context.startSoundcloud(),
    context.startSpotify(),
  ])

  return context
}
