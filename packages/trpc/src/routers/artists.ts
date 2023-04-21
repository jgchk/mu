import fs from 'fs/promises'
import path from 'path'
import { ifNotNull, isNotNull } from 'utils'
import { ensureDir, md5 } from 'utils/node'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { cleanupImage, getImagePath } from '../utils'

export const artistsRouter = router({
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.artists.insert({ name: input.name })),
  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({ name: z.string().min(1), description: z.string().nullable() }),
        art: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldImageId = ctx.db.artists.get(input.id).imageId

      let image: { data: Buffer; id: number } | null | undefined =
        input.art === null ? null : undefined
      const art = input.art ? Buffer.from(input.art, 'base64') : null
      if (art) {
        image = {
          data: art,
          id: ctx.db.images.insert({ hash: md5(art) }).id,
        }

        const imagePath = getImagePath(ctx, image.id)
        await ensureDir(path.dirname(imagePath))
        await fs.writeFile(imagePath, art)
      }

      const imageId = image === null ? null : image?.id
      const artist = ctx.db.artists.update(input.id, {
        ...input.data,
        imageId,
      })

      if (imageId !== undefined && oldImageId !== null) {
        await cleanupImage(ctx, oldImageId)
      }

      return artist
    }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.db.artists.get(input.id)),
  getFull: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    const artist = ctx.db.artists.get(input.id)
    const releases = ctx.db.releases.getByArtist(artist.id).map((release) => ({
      ...release,
      artists: ctx.db.artists.getByReleaseId(release.id),
      imageId:
        ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)?.imageId ??
        null,
    }))
    const tracks = ctx.db.tracks.getByArtist(artist.id).map((track) => ({
      ...track,
      release: ifNotNull(track.releaseId, (releaseId) => ctx.db.releases.get(releaseId)),
      artists: ctx.db.artists.getByTrackId(track.id),
    }))
    return {
      ...artist,
      releases,
      tracks,
    }
  }),
  getAll: publicProcedure.query(({ ctx }) => {
    const artists = ctx.db.artists.getAll()
    return artists.map((artist) => {
      const releaseImageIds = ctx.db.releases
        .getByArtist(artist.id)
        .map(
          (release) =>
            ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)
              ?.imageId ?? null
        )
        .filter(isNotNull)
      const trackImageIds = ctx.db.tracks
        .getByArtist(artist.id)
        .map((track) => track.imageId)
        .filter(isNotNull)
      return { ...artist, imageIds: [...releaseImageIds, ...trackImageIds] }
    })
  }),
})
