import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import ws from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify'
import { handler as svelteKitHandler } from 'client'
import Fastify from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { fileTypeFromBuffer, fileTypeFromFile, fileTypeStream } from 'file-type'
import fs from 'fs'
import { log } from 'log'
import mime from 'mime-types'
import { readTrackCoverArt } from 'music-metadata'
import path from 'path'
import type { AppRouter, Context } from 'trpc'
import { appRouter } from 'trpc'
import { z } from 'zod'

import {
  CollageOptions,
  ResizeOptions,
  handleCreateCollage,
  handleResizeImage,
  isDownloadComplete,
} from './utils'

const IMAGE_CACHE_HEADER = 'public, max-age=31536000, immutable'

export const makeApiServer = async (ctx: Context) => {
  const fastify = Fastify({
    logger: false,
    maxParamLength: 2084,
  }).withTypeProvider<ZodTypeProvider>()
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  await fastify.register(ws)
  await fastify.register(cors)
  await fastify.register(multipart)

  const fastifyTRPCOptions: FastifyTRPCPluginOptions<AppRouter> = {
    prefix: '/api/trpc',
    useWSS: true,
    trpcOptions: {
      router: appRouter,
      createContext: () => ctx,
      onError: ({ error }) => {
        log.error(error)
      },
    },
  }
  await fastify.register(fastifyTRPCPlugin, fastifyTRPCOptions)

  fastify
    .route({
      method: 'GET',
      url: '/api/tracks/:id/stream',
      schema: {
        params: z.object({ id: z.coerce.number() }),
      },
      handler: (req, res) => {
        const track = ctx.db.tracks.get(req.params.id)
        const stream = fs.createReadStream(track.path)
        return res.send(stream)
      },
    })
    .route({
      method: 'GET',
      url: '/api/downloads/group/:service/:id/cover-art',
      schema: {
        params: z.object({
          service: z.enum(['soundcloud', 'spotify', 'soulseek']),
          id: z.coerce.number(),
        }),
      },
      handler: async (req, res) => {
        const { service, id } = req.params

        if (service !== 'soulseek') {
          return res.status(404).send('Not found')
        }

        const fileDownloads = ctx.db.soulseekTrackDownloads.getByReleaseDownloadId(id)
        const completeDownloads = fileDownloads.filter(isDownloadComplete)

        if (completeDownloads.length !== fileDownloads.length) {
          return res.status(400).send('Downloads not complete')
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
          return res.status(404).send('No album cover found')
        }

        const stream = fs.createReadStream(albumCover.dbDownload.path)
        const streamWithFileType = await fileTypeStream(stream)

        if (streamWithFileType.fileType) {
          const contentType = mime.contentType(streamWithFileType.fileType.mime)
          if (contentType) {
            void res.header('Content-Type', contentType)
          }
        }

        return res.send(streamWithFileType)
      },
    })
    .route({
      method: 'GET',
      url: '/api/downloads/track/:service/:id/cover-art',
      schema: {
        params: z.object({
          service: z.enum(['soundcloud', 'spotify', 'soulseek']),
          id: z.coerce.number(),
        }),
      },
      handler: async (req, res) => {
        const { service, id } = req.params

        let fileDownload
        if (service === 'soundcloud') {
          fileDownload = ctx.db.soundcloudTrackDownloads.get(id)
        } else if (service === 'spotify') {
          fileDownload = ctx.db.spotifyTrackDownloads.get(id)
        } else if (service === 'soulseek') {
          fileDownload = ctx.db.soulseekTrackDownloads.get(id)
        } else {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          return res.status(400).send(`Invalid service: ${service}`)
        }

        if (!isDownloadComplete(fileDownload)) {
          return res.status(400).send('Download not complete')
        }

        const coverArt = await readTrackCoverArt(fileDownload.path)

        if (coverArt === undefined) {
          return res.status(404).send('Track does not have cover art')
        }

        const fileType = await fileTypeFromBuffer(coverArt)
        if (fileType) {
          const contentType = mime.contentType(fileType.mime)
          if (contentType) {
            void res.header('Content-Type', contentType)
          }
        }

        return res.send(coverArt)
      },
    })
    .route({
      method: 'GET',
      url: '/api/images/collage',
      schema: {
        querystring: CollageOptions,
      },
      handler: async (req, res) => {
        const opts = req.query

        const { output, contentType } = await handleCreateCollage(opts)
        if (contentType) {
          void res.header('Content-Type', contentType)
        }
        void res.header('Cache-Control', IMAGE_CACHE_HEADER)
        return res.send(output)
      },
    })
    .route({
      method: 'GET',
      url: '/api/images/:id',
      schema: {
        params: z.object({ id: z.coerce.number() }),
        querystring: ResizeOptions,
      },
      handler: async (req, res) => {
        const { id } = req.params
        const { width, height } = req.query

        const { output, contentType } = await handleResizeImage(id, { width, height })
        if (contentType) {
          void res.header('Content-Type', contentType)
        }
        void res.header('Cache-Control', IMAGE_CACHE_HEADER)
        return res.send(output)
      },
    })
    .route({
      method: 'GET',
      url: '/api/tracks/:id/cover-art',
      schema: {
        params: z.object({ id: z.coerce.number() }),
        querystring: ResizeOptions,
      },
      handler: async (req, res) => {
        const { id } = req.params
        const { width, height } = req.query

        const track = ctx.db.tracks.get(id)
        if (track.imageId === null) {
          throw new Error('Track does not have cover art')
        }

        const { output, contentType } = await handleResizeImage(track.imageId, { width, height })
        if (contentType) {
          void res.header('Content-Type', contentType)
        }
        void res.header('Cache-Control', IMAGE_CACHE_HEADER)
        return res.send(output)
      },
    })
    .route({
      method: 'GET',
      url: '/api/releases/:id/cover-art',
      schema: {
        params: z.object({ id: z.coerce.number() }),
        querystring: ResizeOptions,
      },
      handler: async (req, res) => {
        const { id } = req.params
        const { width, height } = req.query

        const release = ctx.db.releases.get(id)
        const tracks = ctx.db.tracks.getByReleaseId(release.id)

        for (const track of tracks) {
          if (track.imageId === null) continue

          const { output, contentType } = await handleResizeImage(track.imageId, {
            width,
            height,
          })
          if (contentType) {
            void res.header('Content-Type', contentType)
          }
          void res.header('Cache-Control', IMAGE_CACHE_HEADER)
          return res.send(output)
        }

        throw new Error('Release does not have cover art')
      },
    })
    .route({
      method: ['GET', 'POST'],
      url: '*',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      handler: (req, res) => svelteKitHandler(req.raw, res.raw),
    })

  return fastify
}
