import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import ws from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify'
import { handler as svelteKitHandler } from 'client'
import type { SystemContext } from 'context'
import type { Session } from 'db'
import Fastify from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { fileTypeFromBuffer, fileTypeFromFile, fileTypeStream } from 'file-type'
import fs from 'fs'
import { log } from 'log'
import mime from 'mime-types'
import { readTrackCoverArt } from 'music-metadata'
import type { Readable } from 'stream'
import type { AppRouter } from 'trpc'
import { appRouter } from 'trpc'
import { ifDefined, isAudio } from 'utils'
import { bufferToStream, getFileSize } from 'utils/node'
import { z } from 'zod'

import {
  CollageOptions,
  ResizeOptions,
  handleCreateCollage,
  handleResizeImage,
  isCoverArtFile,
  isDownloadComplete,
} from './utils'

const IMAGE_CACHE_HEADER = 'public, max-age=31536000, immutable'
const AUDIO_CACHE_HEADER = 'public, max-age=3600, immutable'

declare module 'fastify' {
  interface FastifyRequest {
    session?: Session
  }
}

const bodyLimit = 1024 * 1024 * 1024

export const makeApiServer = async (ctx: () => SystemContext) => {
  const fastify = Fastify({
    logger: false,
    maxParamLength: 2084,
    bodyLimit,
  }).withTypeProvider<ZodTypeProvider>()
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  await fastify.register(ws)
  await fastify.register(cors)
  await fastify.register(multipart, {
    limits: {
      fileSize: bodyLimit,
    },
  })
  await fastify.register(cookie)

  fastify.decorateRequest('session', undefined)
  fastify.addHook('preHandler', (req, _, done) => {
    const sessionToken = req.cookies['session_token']
    if (sessionToken) {
      const session = ctx().db.sessions.findByToken(sessionToken)
      if (session) {
        if (session.expiresAt < new Date()) {
          ctx().db.sessions.delete(sessionToken)
        } else {
          req.session = session
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - this is a hack to get around the fact that fastify's trpc plugin calls
          // createContext with the raw request rather than the FastifyRequest
          req.raw.session = session
        }
      }
    }
    done()
  })

  const fastifyTRPCOptions: FastifyTRPCPluginOptions<AppRouter> = {
    prefix: '/api/trpc',
    useWSS: true,
    trpcOptions: {
      router: appRouter,
      createContext: ({ req }) => {
        return { sys: ctx, session: req.session }
      },
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
      handler: async (req, res) => {
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

        const track = ctx().db.tracks.get(req.params.id)

        if (track === undefined) {
          return res.status(404).send('Track not found')
        }

        const stream = fs.createReadStream(track.path)

        void res
          .header('Cache-Control', AUDIO_CACHE_HEADER)
          .header('Content-Length', await getFileSize(track.path))
          .header('Accept-Ranges', 'bytes')

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
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

        const { service, id } = req.params

        const fileDownloads = ctx().db.downloads.getGroupTrackDownloads(service, id)
        const completeDownloads = fileDownloads.filter(isDownloadComplete)

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

        let stream: Readable | undefined = undefined

        const coverArtFile = imageDownloads.find(
          (download) => 'file' in download.dbDownload && isCoverArtFile(download.dbDownload.file)
        )

        if (coverArtFile) {
          stream = fs.createReadStream(coverArtFile.dbDownload.path)
        } else {
          const audioDownloads = downloads.filter(
            (download) => ifDefined(download.fileType?.mime, isAudio) ?? false
          )

          for (const audioDownload of audioDownloads) {
            const coverArt = await readTrackCoverArt(audioDownload.dbDownload.path)
            if (coverArt) {
              stream = bufferToStream(coverArt)
              break
            }
          }
        }

        if (!stream) {
          return res.status(404).send('No album cover art found')
        }

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
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

        const { service, id } = req.params

        const fileDownload = ctx().db.downloads.getTrackDownload(service, id)

        if (fileDownload === undefined) {
          return res.status(404).send('Download not found')
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
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

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
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

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
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

        const { id } = req.params
        const { width, height } = req.query

        const track = ctx().db.tracks.get(id)

        if (track === undefined) {
          return res.status(404).send('Track not found')
        }

        if (track.imageId === null) {
          return res.status(404).send('Track does not have cover art')
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
        if (!req.session) {
          return res.status(401).send('Unauthorized')
        }

        const { id } = req.params
        const { width, height } = req.query

        const release = ctx().db.releases.get(id)

        if (release === undefined) {
          return res.status(404).send('Release not found')
        }

        const tracks = ctx().db.tracks.getByReleaseId(release.id)

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
