import { applyWSSHandler } from '@trpc/server/adapters/ws'
import Bree from 'bree'
import { getMissingPythonDependencies } from 'music-metadata'
import path from 'path'
import { appRouter } from 'trpc'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'

import { makeApiServer } from './api'
import { makeContext } from './context'
import { env } from './env'

const main = async () => {
  const missingPythonDeps = await getMissingPythonDependencies()
  if (missingPythonDeps.length > 0) {
    console.error('❌ Missing Python dependencies:', missingPythonDeps)
    process.exit(1)
  }

  const ctx = await makeContext()

  const bree = new Bree({
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),
    jobs: [{ name: 'import-lastfm-loved' }, { name: 'import-music-dir' }],
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

  apiServer.listen({ port: env.SERVER_PORT }, (err, address) => {
    if (err) throw err
    console.log(`> Running on ${address}`)
  })

  const wss = new WebSocketServer({ port: 8080 })
  const trpcWsHandler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: () => ctx,
  })

  wss.on('connection', (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`)
    ws.once('close', () => {
      console.log(`➖➖ Connection (${wss.clients.size})`)
    })
  })
  console.log('✅ WebSocket Server listening on ws://localhost:8080')

  let shuttingDown = false
  for (const sig of ['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGUSR2']) {
    process.once(sig, () => {
      if (shuttingDown) return
      shuttingDown = true

      console.log('Shutting down...')
      trpcWsHandler.broadcastReconnectNotification()
      wss.close()
      ctx.destroy()
      void apiServer.close()
    })
  }
}

void main()
