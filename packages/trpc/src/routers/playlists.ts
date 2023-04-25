import { TRPCError } from '@trpc/server'
import { decode } from 'bool-lang'
import type { Playlist, PlaylistTrack, TrackPretty } from 'db'
import fs from 'fs/promises'
import path from 'path'
import { isNotNull } from 'utils'
import { ensureDir, md5 } from 'utils/node'
import { z } from 'zod'

import type { Context } from '../context'
import { publicProcedure, router } from '../trpc'
import { cleanupImage, getImagePath, injectDescendants, TracksFilter } from '../utils'

export const playlistsRouter = router({
  new: publicProcedure
    .input(
      z
        .object({
          name: z.string().min(1),
          description: z.string().nullable(),
          art: z.string().nullish(),
        })
        .and(
          z.union([
            z.object({ filter: z.string() }),
            z.object({ tracks: z.number().array().optional() }),
          ])
        )
    )
    .mutation(async ({ ctx, input }) => {
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
      const playlist = ctx.db.playlists.insert({
        name: input.name,
        description: input.description,
        imageId,
        filter: 'filter' in input ? input.filter : null,
      })

      if ('tracks' in input && input.tracks && !('filter' in input)) {
        ctx.db.playlistTracks.insertManyByPlaylistId(playlist.id, input.tracks)
      }

      return playlist
    }),
  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({ name: z.string().min(1), description: z.string().nullable() }),
        art: z.string().nullish(),
        filter: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldPlaylist = ctx.db.playlists.get(input.id)
      const oldImageId = oldPlaylist.imageId

      if (oldPlaylist.filter === null && input.filter !== undefined && input.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot set filter on non-auto-playlist',
        })
      }

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
      const oldPlaylist = ctx.db.playlists.get(input.playlistId)
      if (oldPlaylist.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot set track order on auto-playlist',
        })
      }

      ctx.db.playlistTracks.updateByPlaylistId(input.playlistId, input.trackIds)
      return ctx.db.playlists.get(input.playlistId)
    }),
  addTrack: publicProcedure
    .input(z.object({ playlistId: z.number(), trackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, trackId } }) => {
      const oldPlaylist = ctx.db.playlists.get(playlistId)
      if (oldPlaylist.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add tracks to auto-playlist',
        })
      }

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
      const oldPlaylist = ctx.db.playlists.get(playlistId)
      if (oldPlaylist.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add tracks to auto-playlist',
        })
      }

      ctx.db.playlistTracks.delete(playlistTrackId)
      return {
        ...ctx.db.playlists.get(playlistId),
        tracks: ctx.db.tracks.getByPlaylistId(playlistId).map((track) => ({
          ...track,
          artists: ctx.db.artists.getByTrackId(track.id),
        })),
      }
    }),
  getAll: publicProcedure
    .input(z.object({ auto: z.boolean().optional() }))
    .query(({ input, ctx }) =>
      ctx.db.playlists.getAll(input).map((playlist) => ({
        ...playlist,
        imageIds: getPlaylistTracks(ctx.db, playlist)
          .map((track) => track.imageId)
          .filter(isNotNull),
      }))
    ),
  getAllHasTrack: publicProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ input: { trackId }, ctx }) => {
      const playlists = ctx.db.playlists.getAll({ auto: false })
      return playlists.map((playlist) => {
        const hasTrack = !!ctx.db.playlistTracks.find(playlist.id, trackId)
        return { ...playlist, hasTrack }
      })
    }),
  getWithTracks: publicProcedure
    .input(z.object({ id: z.number() }).and(TracksFilter))
    .query(({ ctx, input: { id, ...filter } }) => {
      const playlist = ctx.db.playlists.get(id)
      return {
        ...playlist,
        tracks: getPlaylistTracks(ctx.db, playlist, filter).map((track) => ({
          ...track,
          artists: ctx.db.artists.getByTrackId(track.id),
        })),
      }
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

const getPlaylistTracks = (
  db: Context['db'],
  playlist: Playlist,
  filter?: TracksFilter
): (TrackPretty & { playlistTrackId?: PlaylistTrack['id'] })[] => {
  if (playlist.filter !== null) {
    const tagsFilter = decode(playlist.filter)
    return db.tracks.getAll({ ...filter, tags: injectDescendants(db)(tagsFilter) })
  } else {
    return db.tracks.getByPlaylistId(playlist.id, filter)
  }
}
