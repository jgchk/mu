import fs from 'fs/promises'
import path from 'path'
import { isNotNull } from 'utils'
import { ensureDir, md5 } from 'utils/node'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { cleanupImage, getImagePath } from '../utils'

export const playlistsRouter = router({
  new: publicProcedure
    .input(z.object({ name: z.string().min(1), tracks: z.number().array().optional() }))
    .mutation(({ ctx, input: { name, tracks } }) => {
      const playlist = ctx.db.playlists.insert({ name })
      if (tracks) {
        ctx.db.playlistTracks.insertManyByPlaylistId(playlist.id, tracks)
      }
      return playlist
    }),
  addTrack: publicProcedure
    .input(z.object({ playlistId: z.number(), trackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, trackId } }) => {
      ctx.db.playlistTracks.addTrack(playlistId, trackId)
      return {
        ...ctx.db.playlists.get(playlistId),
        tracks: ctx.db.tracks.getByPlaylistId(playlistId).map((track) => ({
          ...track,
          artists: ctx.db.artists.getByTrackId(track.id),
        })),
      }
    }),
  removeTrack: publicProcedure
    .input(z.object({ playlistId: z.number(), playlistTrackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, playlistTrackId } }) => {
      ctx.db.playlistTracks.delete(playlistTrackId)
      return {
        ...ctx.db.playlists.get(playlistId),
        tracks: ctx.db.tracks.getByPlaylistId(playlistId).map((track) => ({
          ...track,
          artists: ctx.db.artists.getByTrackId(track.id),
        })),
      }
    }),
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.playlists.getAll().map((playlist) => ({
      ...playlist,
      imageIds: ctx.db.tracks
        .getByPlaylistId(playlist.id)
        .map((track) => track.imageId)
        .filter(isNotNull),
    }))
  ),
  getAllHasTrack: publicProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ input: { trackId }, ctx }) => {
      const playlists = ctx.db.playlists.getAll()
      return playlists.map((playlist) => {
        const hasTrack = !!ctx.db.playlistTracks.find(playlist.id, trackId)
        return { ...playlist, hasTrack }
      })
    }),
  getWithTracks: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => ({
    ...ctx.db.playlists.get(input.id),
    tracks: ctx.db.tracks.getByPlaylistId(input.id).map((track) => ({
      ...track,
      artists: ctx.db.artists.getByTrackId(track.id),
    })),
  })),
  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({ name: z.string().min(1), description: z.string().nullable() }),
        art: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldImageId = ctx.db.playlists.get(input.id).imageId

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
      const playlist = ctx.db.playlists.update(input.id, {
        ...input.data,
        imageId,
      })

      if (imageId !== undefined && oldImageId !== null) {
        await cleanupImage(ctx, oldImageId)
      }

      return playlist
    }),
  editTrackOrder: publicProcedure
    .input(z.object({ playlistId: z.number(), trackIds: z.number().array() }))
    .mutation(({ ctx, input }) => {
      ctx.db.playlistTracks.updateByPlaylistId(input.playlistId, input.trackIds)
      return ctx.db.playlists.get(input.playlistId)
    }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const imageId = ctx.db.playlists.get(input.id).imageId
    if (imageId !== null) {
      await cleanupImage(ctx, imageId)
    }
    ctx.db.playlists.delete(input.id)
    return null
  }),
})
