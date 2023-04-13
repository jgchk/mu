import { applyWSSHandler } from '@trpc/server/adapters/ws'
import Bree from 'bree'
import cors from 'cors'
import express from 'express'
import { getMissingPythonDependencies } from 'music-metadata'
import path from 'path'
import { appRouter } from 'trpc'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'

import { ctx } from './context'
import { db } from './context/db'
import { dl } from './context/dl'
import { slsk } from './context/slsk'
import { env } from './env'
import { router } from './router'

const main = async () => {
  const missingPythonDeps = await getMissingPythonDependencies()
  if (missingPythonDeps.length > 0) {
    console.error('❌ Missing Python dependencies:', missingPythonDeps)
    process.exit(1)
  }

  const bree = new Bree({
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),
    jobs: [{ name: 'import-lastfm-loved' }],
  })
  await bree.start()

  // Resume downloads
  for (const download of db.soundcloudPlaylistDownloads.getAll()) {
    void dl.download({ service: 'soundcloud', type: 'playlist', dbId: download.id })
  }
  for (const download of db.soundcloudTrackDownloads.getByPlaylistDownloadId(null)) {
    void dl.download({ service: 'soundcloud', type: 'track', dbId: download.id })
  }
  for (const download of db.spotifyAlbumDownloads.getAll()) {
    void dl.download({ service: 'spotify', type: 'album', dbId: download.id })
  }
  for (const download of db.spotifyTrackDownloads.getByAlbumDownloadId(null)) {
    void dl.download({ service: 'spotify', type: 'track', dbId: download.id })
  }
  for (const download of db.soulseekTrackDownloads.getAll()) {
    void dl.download({ service: 'soulseek', type: 'track', dbId: download.id })
  }

  const app = express().use(cors()).use(router)

  const server = app.listen({ port: env.SERVER_PORT }, () => {
    console.log(`> Running on localhost:${env.SERVER_PORT}`)
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

  process.on('SIGINT', () => {
    console.log('Shutting down...')
    trpcWsHandler.broadcastReconnectNotification()
    wss.close()
    server.close()
    db.close()
    dl.close()
    slsk.destroy()
  })
}

void main()
