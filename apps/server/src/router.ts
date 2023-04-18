import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { handler as svelteKitHandler } from 'client'
import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { fileTypeFromBuffer, fileTypeFromFile, fileTypeStream } from 'file-type'
import fs from 'fs'
import { isAnimatedGifStream } from 'is-animated-gif'
import mime from 'mime-types'
import { readTrackCoverArt } from 'music-metadata'
import path from 'path'
import sharp from 'sharp'
import type { Readable } from 'stream'
import { PassThrough } from 'stream'
import type { Context } from 'trpc'
import { appRouter } from 'trpc'
import { z } from 'zod'

import { env } from './env'

type Complete<T extends { path: string | null }> = Omit<T, 'path'> & {
  path: NonNullable<T['path']>
}
const isDownloadComplete = <T extends { path: string | null }>(
  dl: T | Complete<T>
): dl is Complete<T> => {
  return dl.path !== null
}

const handleResizeStream = async (
  stream: Readable,
  { width, height }: { width?: number; height?: number }
): Promise<{ output: Readable; contentType?: string }> => {
  if (width !== undefined || height !== undefined) {
    const ftStream = await fileTypeStream(stream)
    if (ftStream.fileType?.mime === 'image/gif') {
      const animated = await isAnimatedGifStream(ftStream)
      if (animated) {
        // resizing animated gifs is super slow. just return the original
        return { output: ftStream, contentType: 'image/gif' }
      } else {
        const resizerStream = sharp().resize(width, height).gif()
        const resizedStream = ftStream.pipe(resizerStream).pipe(new PassThrough())
        return { output: resizedStream, contentType: 'image/gif' }
      }
    } else {
      const resizerStream = sharp().resize(width, height).png()
      const resizedStream = ftStream.pipe(resizerStream).pipe(new PassThrough())
      return { output: resizedStream, contentType: 'image/png' }
    }
  } else {
    let contentType: string | undefined
    const ftStream = await fileTypeStream(stream)
    if (ftStream.fileType) {
      contentType = mime.contentType(ftStream.fileType.mime) || undefined
    }
    return { output: ftStream, contentType }
  }
}

export const makeRouter = (ctx: Context) => {
  const router = Router()

  router
    .use(
      '/api/trpc',
      createExpressMiddleware({
        router: appRouter,
        createContext: () => ctx,
      })
    )
    .get('/api/ping', (req, res) => {
      res.send('pong!')
    })
    .get('/api/tracks/:id/stream', (req, res) => {
      const { id } = z.object({ id: z.coerce.number() }).parse(req.params)
      const track = ctx.db.tracks.get(id)
      const stream = fs.createReadStream(track.path)
      stream.pipe(res)
    })
    .get(
      '/api/downloads/group/:service/:id/cover-art',
      asyncHandler(async (req, res) => {
        const { service, id } = z
          .object({
            service: z.enum(['soundcloud', 'spotify', 'soulseek']),
            id: z.coerce.number(),
          })
          .parse(req.params)

        if (service !== 'soulseek') {
          res.status(404).send('Not found')
          return
        }

        const fileDownloads = ctx.db.soulseekTrackDownloads.getByReleaseDownloadId(id)
        const completeDownloads = fileDownloads.filter(isDownloadComplete)

        if (completeDownloads.length !== fileDownloads.length) {
          res.status(400).send('Downloads not complete')
          return
        }

        const downloads = await Promise.all(
          completeDownloads.map(async (dbDownload) => {
            const fileType = await fileTypeFromFile(dbDownload.path)
            return {
              dbDownload,
              fileType,
            }
          })
        )

        const imageDownloads = downloads.filter((download) =>
          download.fileType?.mime.startsWith('image/')
        )

        const albumCover = imageDownloads.find((download) => {
          const filename = path
            .parse(download.dbDownload.file.replaceAll('\\', '/'))
            .name.toLowerCase()
          return filename === 'front' || filename === 'cover' || filename === 'folder'
        })

        if (!albumCover) {
          res.status(404).send('No album cover found')
          return
        }

        const stream = fs.createReadStream(albumCover.dbDownload.path)
        const streamWithFileType = await fileTypeStream(stream)

        if (streamWithFileType.fileType) {
          const contentType = mime.contentType(streamWithFileType.fileType.mime)
          if (contentType) {
            res.setHeader('Content-Type', contentType)
          }
        }

        streamWithFileType.pipe(res)
      })
    )
    .get(
      '/api/downloads/track/:service/:id/cover-art',
      asyncHandler(async (req, res) => {
        const { service, id } = z
          .object({
            service: z.enum(['soundcloud', 'spotify', 'soulseek']),
            id: z.coerce.number(),
          })
          .parse(req.params)

        let fileDownload
        if (service === 'soundcloud') {
          fileDownload = ctx.db.soundcloudTrackDownloads.get(id)
        } else if (service === 'spotify') {
          fileDownload = ctx.db.spotifyTrackDownloads.get(id)
        } else if (service === 'soulseek') {
          fileDownload = ctx.db.soulseekTrackDownloads.get(id)
        } else {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          res.status(400).send(`Invalid service: ${service}`)
          return
        }

        if (!isDownloadComplete(fileDownload)) {
          res.status(400).send('Download not complete')
          return
        }

        const coverArt = await readTrackCoverArt(fileDownload.path)

        if (coverArt === undefined) {
          res.status(404).send('Track does not have cover art')
          return
        }

        const fileType = await fileTypeFromBuffer(coverArt)
        if (fileType) {
          const contentType = mime.contentType(fileType.mime)
          if (contentType) {
            res.setHeader('Content-Type', contentType)
          }
        }
        res.send(coverArt)
      })
    )
    .get(
      '/api/images/:id',
      asyncHandler(async (req, res) => {
        const { id } = z.object({ id: z.coerce.number() }).parse(req.params)
        const { width, height } = z
          .object({
            width: z.coerce.number().optional(),
            height: z.coerce.number().optional(),
          })
          .parse(req.query)
        const imagePath = path.resolve(path.join(env.IMAGES_DIR, id.toString()))
        const readStream = fs.createReadStream(imagePath)
        const { output, contentType } = await handleResizeStream(readStream, { width, height })
        if (contentType) {
          res.set('Content-Type', contentType)
        }
        res.set('Cache-Control', 'public, max-age=31536000, immutable')
        output.pipe(res)
      })
    )
    .get(
      '/api/tracks/:id/cover-art',
      asyncHandler(async (req, res) => {
        const { id } = z.object({ id: z.coerce.number() }).parse(req.params)
        const { width, height } = z
          .object({
            width: z.coerce.number().optional(),
            height: z.coerce.number().optional(),
          })
          .parse(req.query)

        const track = ctx.db.tracks.get(id)
        if (track.imageId === null) {
          throw new Error('Track does not have cover art')
        }

        const imagePath = path.resolve(path.join(env.IMAGES_DIR, track.imageId.toString()))
        const readStream = fs.createReadStream(imagePath)
        const { output, contentType } = await handleResizeStream(readStream, { width, height })
        if (contentType) {
          res.set('Content-Type', contentType)
        }
        res.set('Cache-Control', 'public, max-age=31536000, immutable')
        output.pipe(res)
      })
    )
    .get(
      '/api/releases/:id/cover-art',
      asyncHandler(async (req, res) => {
        const { id } = z.object({ id: z.coerce.number() }).parse(req.params)
        const { width, height } = z
          .object({
            width: z.coerce.number().optional(),
            height: z.coerce.number().optional(),
          })
          .parse(req.query)

        const release = ctx.db.releases.get(id)
        const tracks = ctx.db.tracks.getByReleaseId(release.id)

        for (const track of tracks) {
          if (track.imageId !== null) {
            const imagePath = path.resolve(env.IMAGES_DIR, track.imageId.toString())
            const readStream = fs.createReadStream(imagePath)
            const { output, contentType } = await handleResizeStream(readStream, { width, height })
            if (contentType) {
              res.set('Content-Type', contentType)
            }
            res.set('Cache-Control', 'public, max-age=31536000, immutable')
            output.pipe(res)
            return
          }
        }

        throw new Error('Release does not have cover art')
      })
    )
    .use(svelteKitHandler)

  return router
}
