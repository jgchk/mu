import { TRPCError } from '@trpc/server'
import { decode } from 'bool-lang'
import type { Database, Playlist, PlaylistTrack, Track } from 'db'
import { isNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter, injectDescendants } from '../utils'

export const playlistsRouter = router({
  new: protectedProcedure
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
          id: (await ctx.sys().img.getImage(art)).id,
        }
      }

      const imageId = image === null ? null : image?.id
      const playlist = ctx.sys().db.playlists.insert({
        name: input.name,
        description: input.description,
        imageId,
        filter: 'filter' in input ? input.filter : null,
      })

      if ('tracks' in input && input.tracks && !('filter' in input)) {
        ctx.sys().db.playlistTracks.insertManyByPlaylistId(playlist.id, input.tracks)
      }

      return playlist
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1),
          description: z.string().nullable(),
          filter: z.string().nullish(),
        }),
        art: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldPlaylist = ctx.sys().db.playlists.get(input.id)

      if (oldPlaylist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      const oldImageId = oldPlaylist.imageId

      if (
        oldPlaylist.filter === null &&
        input.data.filter !== undefined &&
        input.data.filter !== null
      ) {
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
          id: (await ctx.sys().img.getImage(art)).id,
        }
      }

      const imageId = image === null ? null : image?.id
      const playlist = ctx.sys().db.playlists.update(input.id, {
        ...input.data,
        imageId,
      })

      if (playlist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      if (imageId !== undefined && oldImageId !== null) {
        await ctx.sys().img.cleanupImage(oldImageId)
      }

      return playlist
    }),

  editTrackOrder: protectedProcedure
    .input(z.object({ playlistId: z.number(), trackIds: z.number().array() }))
    .mutation(({ ctx, input }) => {
      const oldPlaylist = ctx.sys().db.playlists.get(input.playlistId)

      if (oldPlaylist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      if (oldPlaylist.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot set track order on auto-playlist',
        })
      }

      ctx.sys().db.playlistTracks.updateByPlaylistId(input.playlistId, input.trackIds)
      const playlist = ctx.sys().db.playlists.get(input.playlistId)

      if (playlist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      return playlist
    }),

  addTrack: protectedProcedure
    .input(z.object({ playlistId: z.number(), trackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, trackId } }) => {
      const oldPlaylist = ctx.sys().db.playlists.get(playlistId)

      if (oldPlaylist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      if (oldPlaylist.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add tracks to auto-playlist',
        })
      }

      ctx.sys().db.playlistTracks.addTrack(playlistId, trackId)

      return getPlaylistTracks(ctx.sys().db, oldPlaylist).map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
      }))
    }),

  removeTrack: protectedProcedure
    .input(z.object({ playlistId: z.number(), playlistTrackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, playlistTrackId } }) => {
      const oldPlaylist = ctx.sys().db.playlists.get(playlistId)

      if (oldPlaylist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      if (oldPlaylist.filter !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add tracks to auto-playlist',
        })
      }

      ctx.sys().db.playlistTracks.delete(playlistTrackId)
      return getPlaylistTracks(ctx.sys().db, oldPlaylist).map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
      }))
    }),

  getAll: protectedProcedure
    .input(z.object({ auto: z.boolean().optional() }))
    .query(({ input, ctx }) =>
      ctx
        .sys()
        .db.playlists.getAll(input)
        .map((playlist) => ({
          ...playlist,
          imageIds: getPlaylistTracks(ctx.sys().db, playlist)
            .map((track) => track.imageId)
            .filter(isNotNull),
        }))
    ),

  getAllHasTrack: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ input: { trackId }, ctx }) => {
      const playlists = ctx.sys().db.playlists.getAll({ auto: false })
      return playlists.map((playlist) => {
        const hasTrack = !!ctx.sys().db.playlistTracks.find(playlist.id, trackId)
        return { ...playlist, hasTrack }
      })
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input: { id } }) => {
    const playlist = ctx.sys().db.playlists.get(id)

    if (playlist === undefined) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Playlist not found',
      })
    }

    const imageIds = getPlaylistTracks(ctx.sys().db, playlist)
      .map((track) => track.imageId)
      .filter(isNotNull)
    return {
      ...playlist,
      imageIds,
    }
  }),

  tracks: protectedProcedure
    .input(z.object({ id: z.number() }).and(TracksFilter))
    .query(({ ctx, input: { id, ...filter } }) => {
      const playlist = ctx.sys().db.playlists.get(id)

      if (playlist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      return getPlaylistTracks(ctx.sys().db, playlist, filter).map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
      }))
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const imageId = ctx.sys().db.playlists.get(input.id)?.imageId ?? null

      if (imageId !== null) {
        await ctx.sys().img.cleanupImage(imageId)
      }
      ctx.sys().db.playlists.delete(input.id)
      return null
    }),
})

const getPlaylistTracks = (
  db: Database,
  playlist: Playlist,
  filter?: TracksFilter
): (Track & { playlistTrackId?: PlaylistTrack['id'] })[] => {
  if (playlist.filter !== null) {
    const tagsFilter = decode(playlist.filter)
    return db.tracks.getAll({ ...filter, tags: injectDescendants(db)(tagsFilter) })
  } else {
    return db.tracks.getByPlaylistId(playlist.id, filter)
  }
}
