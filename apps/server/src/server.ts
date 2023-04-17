import { applyWSSHandler } from '@trpc/server/adapters/ws'
import Bree from 'bree'
import cors from 'cors'
import express from 'express'
import { getMissingPythonDependencies } from 'music-metadata'
import path from 'path'
import type { Context } from 'trpc'
import { appRouter } from 'trpc'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'

import { makeContext } from './context'
import { env } from './env'
import { makeRouter } from './router'

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

  const ctx = await makeContext()

  setConfigFromEnv(ctx)

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

  const app = express().use(cors()).use(makeRouter(ctx))

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
    ctx.destroy()
  })
}

const setConfigFromEnv = (ctx: Context) => {
  const config = ctx.db.configs.get()

  ctx.db.configs.update({
    soundcloudAuthToken: config.soundcloudAuthToken ?? env.SOUNDCLOUD_AUTH_TOKEN,
    spotifyClientId: config.spotifyClientId ?? env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: config.spotifyClientSecret ?? env.SPOTIFY_CLIENT_SECRET,
    spotifyUsername: config.spotifyUsername ?? env.SPOTIFY_USERNAME,
    spotifyPassword: config.spotifyPassword ?? env.SPOTIFY_PASSWORD,
    spotifyDcCookie: config.spotifyDcCookie ?? env.SPOTIFY_DC_COOKIE,
    soulseekUsername: config.soulseekUsername ?? env.SOULSEEK_USERNAME,
    soulseekPassword: config.soulseekPassword ?? env.SOULSEEK_PASSWORD,
    lastFmKey: config.lastFmKey ?? env.LASTFM_KEY,
    lastFmSecret: config.lastFmSecret ?? env.LASTFM_SECRET,
    lastFmUsername: config.lastFmUsername ?? env.LASTFM_USERNAME,
    lastFmPassword: config.lastFmPassword ?? env.LASTFM_PASSWORD,
  })
}

void main()
