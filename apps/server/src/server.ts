import Bree from 'bree'
import { log } from 'log'
import { getMissingPythonDependencies } from 'music-metadata'
import path from 'path'
import { fileURLToPath } from 'url'

import { makeApiServer } from './api'
import { makeContext } from './context'
import { env } from './env'

const main = async () => {
  const missingPythonDeps = await getMissingPythonDependencies()
  if (missingPythonDeps.length > 0) {
    log.error({ missingPythonDeps }, '❌ Missing Python dependencies')
    process.exit(1)
  }

  const ctx = await makeContext()

  const bree = new Bree({
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),
    jobs: [{ name: 'import-lastfm-loved' }, { name: 'import-music-dir' }],
    logger: log,
  })
  await bree.start()

  // Resume downloads
  for (const download of ctx.db.soundcloudPlaylistDownloads.getAll()) {
    void ctx.dl.download({ service: 'soundcloud', type: 'playlist', dbId: download.id })
  }
  for (const download of ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(null)) {
    void ctx.dl.download({ service: 'soundcloud', type: 'track', dbId: download.id })
  }
  for (const download of ctx.db.spotifyAlbumDownloads.getAll()) {
    void ctx.dl.download({ service: 'spotify', type: 'album', dbId: download.id })
  }
  for (const download of ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(null)) {
    void ctx.dl.download({ service: 'spotify', type: 'track', dbId: download.id })
  }
  for (const download of ctx.db.soulseekTrackDownloads.getAll()) {
    void ctx.dl.download({ service: 'soulseek', type: 'track', dbId: download.id })
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
      ctx.destroy()
      void apiServer.close()
    })
  }
}

void main()
