import Bree from 'bree'
import { env } from 'env'
import { log } from 'log'
import path from 'path'
import { fileURLToPath } from 'url'
import { sleep } from 'utils'

import { makeApiServer } from './api'
import { makeContext } from './context'

const main = async () => {
  const bree = new Bree({
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),
    jobs: [{ name: 'services' }, { name: 'import-lastfm-loved' }, { name: 'import-music-dir' }],
    logger: log,
    errorHandler: (error, workerMetadata) => {
      log.error(error)
      log.error(workerMetadata)
    },
    workerMessageHandler: ({ name, message }) => {
      log.debug(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-template-expressions
        `Worker for job "${name}" sent a message: ${JSON.stringify(message).slice(0, 4096)}`
      )
    },
  })
  await bree.start()

  let servicesWorker
  while (!(servicesWorker = bree.workers.get('services'))) {
    log.info('Waiting for services to start')
    await sleep(100)
  }
  servicesWorker.setMaxListeners(50)

  const ctx = await makeContext(servicesWorker)

  // Resume downloads
  for (const download of ctx.db.soundcloudPlaylistDownloads.getAll()) {
    void ctx.download({ service: 'soundcloud', type: 'playlist', dbId: download.id })
  }
  for (const download of ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(null)) {
    void ctx.download({ service: 'soundcloud', type: 'track', dbId: download.id })
  }
  for (const download of ctx.db.spotifyAlbumDownloads.getAll()) {
    void ctx.download({ service: 'spotify', type: 'album', dbId: download.id })
  }
  for (const download of ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(null)) {
    void ctx.download({ service: 'spotify', type: 'track', dbId: download.id })
  }
  for (const download of ctx.db.soulseekTrackDownloads.getAll()) {
    void ctx.download({ service: 'soulseek', type: 'track', dbId: download.id })
  }

  const apiServer = await makeApiServer(ctx)

  apiServer.listen({ host: env.SERVER_HOST, port: env.SERVER_PORT }, (err, address) => {
    if (err) {
      log.error(err)
      process.exit(1)
    } else {
      log.info(`> Running on ${address}`)
    }
  })

  let shuttingDown = false
  for (const sig of ['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGUSR2']) {
    process.once(sig, () => {
      if (shuttingDown) return
      shuttingDown = true

      log.info('Shutting down...')
      void ctx.destroy()
      void apiServer.close()
    })
  }
}

void main()
