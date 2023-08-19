import { TRPCError } from '@trpc/server'
import { artists, eq } from 'db'
import { ifNotNull, isNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter } from '../utils'

export const artistsRouter = router({
  add: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.sys().db.db.insert(artists).values({ name: input.name }).returning().get()
    ),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({ name: z.string().min(1), description: z.string().nullable() }),
        art: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let artist = ctx.sys().db.db.select().from(artists).where(eq(artists.id, input.id)).get()
      if (artist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artist not found',
        })
      }

      const oldImageId = artist.imageId

      let image: { data: Buffer; id: number } | null | undefined =
        input.art === null ? null : undefined
      const art = input.art ? Buffer.from(input.art, 'base64') : null
      if (art) {
        image = {
          data: art,
          id: (await ctx.sys().img.getImage(art)).id,
        }
      }

      const imageId = image === null ? null : image?.id
      artist = ctx.sys().db.artists.update(input.id, {
        ...input.data,
        imageId,
      })

      if (artist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artist not found',
        })
      }

      if (imageId !== undefined && oldImageId !== null) {
        await ctx.sys().img.cleanupImage(oldImageId)
      }

      return artist
    }),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    const artist = ctx.sys().db.db.select().from(artists).where(eq(artists.id, input.id)).get()

    if (artist === undefined) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Artist not found',
      })
    }

    const releaseImageIds = ctx
      .sys()
      .db.releases.getByArtist(artist.id)
      .map(
        (release) =>
          ctx
            .sys()
            .db.tracks.getByReleaseId(release.id)
            .find((track) => track.imageId !== null)?.imageId ?? null
      )
      .filter(isNotNull)
    const trackImageIds = ctx
      .sys()
      .db.tracks.getByArtist(artist.id)
      .map((track) => track.imageId)
      .filter(isNotNull)

    return {
      ...artist,
      imageIds: [...releaseImageIds, ...trackImageIds],
    }
  }),
  releases: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
    ctx
      .sys()
      .db.releases.getByArtist(input.id)
      .map((release) => ({
        ...release,
        artists: ctx.sys().db.artists.getByReleaseId(release.id),
        imageId:
          ctx
            .sys()
            .db.tracks.getByReleaseId(release.id)
            .find((track) => track.imageId !== null)?.imageId ?? null,
      }))
  ),
  tracks: protectedProcedure
    .input(z.object({ id: z.number() }).and(TracksFilter))
    .query(({ ctx, input: { id, ...filter } }) =>
      ctx
        .sys()
        .db.tracks.getByArtist(id, filter)
        .map((track) => ({
          ...track,
          release: ifNotNull(track.releaseId, (releaseId) => ctx.sys().db.releases.get(releaseId)),
          artists: ctx.sys().db.artists.getByTrackId(track.id),
        }))
    ),
  getAll: protectedProcedure.query(({ ctx }) => {
    const results = ctx.sys().db.db.select().from(artists).orderBy(artists.name).all()
    return results.map((artist) => {
      const releaseImageIds = ctx
        .sys()
        .db.releases.getByArtist(artist.id)
        .map(
          (release) =>
            ctx
              .sys()
              .db.tracks.getByReleaseId(release.id)
              .find((track) => track.imageId !== null)?.imageId ?? null
        )
        .filter(isNotNull)
      const trackImageIds = ctx
        .sys()
        .db.tracks.getByArtist(artist.id)
        .map((track) => track.imageId)
        .filter(isNotNull)
      return { ...artist, imageIds: [...releaseImageIds, ...trackImageIds] }
    })
  }),
})
