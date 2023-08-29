import Bree from 'bree'
import type { SystemContext } from 'context'
import { makeContext } from 'context'
import { env } from 'env'
import { log } from 'log'
import path from 'path'
import { fileURLToPath } from 'url'

import { makeApiServer } from './api'

const main = async () => {
  const ctx = await makeContext()

  const apiServer = await makeApiServer(ctx)

  apiServer.listen({ host: env.SERVER_HOST, port: env.SERVER_PORT }, (err, address) => {
    if (err) {
      log.error(err)
      process.exit(1)
    } else {
      log.info(`> Running on ${address}`)
    }
  })

  const [bree] = await Promise.all([startBree(), resumeDownloads(ctx())])

  let shuttingDown = false
  for (const sig of ['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGUSR2']) {
    process.once(sig, () => {
      if (shuttingDown) return
      shuttingDown = true
      log.info('Shutting down...')

      void Promise.all([ctx().destroy(), bree.stop(), apiServer.close()])
    })
  }
}

const startBree = async () => {
  const bree = new Bree({
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),
    jobs: ['import-music-dir'],
    logger: log,
    errorHandler: (error, workerMetadata) => {
      log.error(error)
      log.error(workerMetadata)
    },
  })

  bree.on('worker deleted', (worker) => {
    if (worker === 'import-music-dir') {
      console.log('deleted', worker)
      void bree.add('import-lastfm-loved').then(() => bree.start('import-lastfm-loved'))
    }
  })

  await bree.start()

  return bree
}

const resumeDownloads = (ctx: SystemContext) =>
  Promise.all([
    ...ctx.db.soundcloudPlaylistDownloads
      .getAll()
      .map((download) =>
        ctx.dl.download({ service: 'soundcloud', type: 'playlist', dbId: download.id })
      ),
    ...ctx.db.soundcloudTrackDownloads
      .getByPlaylistDownloadId(null)
      .map((download) =>
        ctx.dl.download({ service: 'soundcloud', type: 'track', dbId: download.id })
      ),
    ...ctx.db.spotifyAlbumDownloads
      .getAll()
      .map((download) => ctx.dl.download({ service: 'spotify', type: 'album', dbId: download.id })),
    ...ctx.db.spotifyTrackDownloads
      .getByAlbumDownloadId(null)
      .map((download) => ctx.dl.download({ service: 'spotify', type: 'track', dbId: download.id })),
    ...ctx.db.soulseekTrackDownloads
      .getAll()
      .map((download) =>
        ctx.dl.download({ service: 'soulseek', type: 'track', dbId: download.id })
      ),
  ])

void main()
