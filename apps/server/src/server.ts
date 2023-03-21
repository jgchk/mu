import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { handler as svelteKitHandler } from 'client';
import cors from 'cors';
import { Database } from 'db';
import { DownloadQueue } from 'downloader';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import mime from 'mime-types';
import { readTrackCoverArt } from 'music-metadata';
import sharp from 'sharp';
import { appRouter } from 'trpc';
import { WebSocketServer } from 'ws';
import { z } from 'zod';

import { env } from './env';

const PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : undefined;
if (PORT === undefined) {
  console.error('SERVER_PORT is not defined');
  process.exit(1);
}
if (isNaN(PORT)) {
  console.error('SERVER_PORT is not a number');
  process.exit(1);
}

const app = express();
const db = new Database(env.DATABASE_URL);
const dl = new DownloadQueue(db);

const handleResize = async (
  buffer: Buffer,
  { width, height }: { width?: number; height?: number }
): Promise<{ output: Buffer; contentType?: string }> => {
  if (width !== undefined || height !== undefined) {
    const resizedBuffer = await sharp(buffer).resize(width, height).png().toBuffer();
    return { output: resizedBuffer, contentType: 'image/png' };
  } else {
    let contentType: string | undefined;
    const fileType = await fileTypeFromBuffer(buffer);
    if (fileType) {
      contentType = mime.contentType(fileType.mime) || undefined;
    }
    return { output: buffer, contentType };
  }
};

app
  .use(cors())
  .use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: () => ({ db, dl })
    })
  )
  .get('/api/ping', (req, res) => {
    res.send('pong!');
  })
  .get('/api/tracks/:id/stream', (req, res) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const track = db.tracks.get(id);
    const stream = fs.createReadStream(track.path);
    stream.pipe(res);
  })
  .get(
    '/api/tracks/:id/cover-art',
    asyncHandler(async (req, res) => {
      const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
      const { width, height } = z
        .object({
          width: z.coerce.number().optional(),
          height: z.coerce.number().optional()
        })
        .parse(req.query);

      const track = db.tracks.get(id);
      if (!track.hasCoverArt) {
        throw new Error('Track does not have cover art');
      }

      const coverArt = await readTrackCoverArt(track.path);

      if (coverArt === undefined) {
        throw new Error('Track does not have cover art');
      }

      const { output, contentType } = await handleResize(coverArt, { width, height });
      if (contentType) {
        res.set('Content-Type', contentType);
      }
      res.send(output);
    })
  )
  .get(
    '/api/releases/:id/cover-art',
    asyncHandler(async (req, res) => {
      const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
      const { width, height } = z
        .object({
          width: z.coerce.number().optional(),
          height: z.coerce.number().optional()
        })
        .parse(req.query);

      const release = db.releases.get(id);
      const tracks = db.tracks.getByReleaseId(release.id);

      for (const track of tracks) {
        if (track.hasCoverArt) {
          const coverArt = await readTrackCoverArt(track.path);
          if (coverArt !== undefined) {
            const { output, contentType } = await handleResize(coverArt, { width, height });
            if (contentType) {
              res.set('Content-Type', contentType);
            }
            res.send(output);
            return;
          }
        }
      }

      throw new Error('Release does not have cover art');
    })
  )
  .use(svelteKitHandler);

const server = app.listen({ port: PORT }, () => {
  console.log(`> Running on localhost:${PORT}`);
});

const wss = new WebSocketServer({ port: 8080 });
const trpcWsHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: () => ({ db, dl })
});

wss.on('connection', (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});
console.log('✅ WebSocket Server listening on ws://localhost:8080');

process.on('SIGINT', () => {
  console.log('SIGTERMOP');
  trpcWsHandler.broadcastReconnectNotification();
  wss.close();
  server.close();
  db.close();
  dl.close();
});
