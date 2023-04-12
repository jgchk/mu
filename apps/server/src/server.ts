import { applyWSSHandler } from '@trpc/server/adapters/ws'
import cors from 'cors'
import express from 'express'
import { getMissingPythonDependencies } from 'music-metadata'
import { appRouter } from 'trpc'
import { WebSocketServer } from 'ws'

import { ctx } from './context'
import { router } from './router'

const main = async () => {
  const missingPythonDeps = await getMissingPythonDependencies()
  if (missingPythonDeps.length > 0) {
    console.error('❌ Missing Python dependencies:', missingPythonDeps)
    process.exit(1)
  }

  const PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : undefined
  if (PORT === undefined) {
    console.error('SERVER_PORT is not defined')
    process.exit(1)
  }
  if (isNaN(PORT)) {
    console.error('SERVER_PORT is not a number')
    process.exit(1)
  }

  const app = express()

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
  for (const download of ctx.db.spotifyTrackDownloads.getAll()) {
    void ctx.dl.download({ service: 'spotify', type: 'track', dbId: download.id })
  }
  for (const download of ctx.db.soulseekTrackDownloads.getAll()) {
    void ctx.dl.download({ service: 'soulseek', type: 'track', dbId: download.id })
  }

  app.use(cors()).use(router)

  const server = app.listen({ port: PORT }, () => {
    console.log(`> Running on localhost:${PORT}`)
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
    ctx.destroy()
  })
}

void main()
