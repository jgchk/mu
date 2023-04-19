import fs from 'fs/promises'
import path from 'path'
import { ensureDir, md5 } from 'utils/node'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { cleanupImage, getImagePath } from '../utils'

export const playlistsRouter = router({
  new: publicProcedure
    .input(z.object({ name: z.string().min(1), tracks: z.number().array().optional() }))
    .mutation(({ ctx, input: { name, tracks } }) =>
      ctx.db.playlists.insertWithTracks({ name }, tracks)
    ),
  addTrack: publicProcedure
    .input(z.object({ playlistId: z.number(), trackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, trackId } }) => {
      const track = ctx.db.playlists.addTrack(playlistId, trackId)
      const playlist = ctx.db.playlists.get(playlistId)
      return { playlist, track }
    }),
  getAll: publicProcedure.query(({ ctx }) => ctx.db.playlists.getAll()),
  getAllHasTrack: publicProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ input: { trackId }, ctx }) => {
      const playlists = ctx.db.playlists.getAll()
      return playlists.map((playlist) => {
        const hasTrack = !!ctx.db.playlistTracks.find(playlist.id, trackId)
        return { ...playlist, hasTrack }
      })
    }),
  getWithTracks: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.db.playlists.getWithTracks(input.id)),
  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({ name: z.string().min(1), description: z.string().nullable() }),
        art: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldImageId = ctx.db.playlists.get(input.id).imageId

      let image: { data: Buffer; id: number } | undefined = undefined
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

      const playlist = ctx.db.playlists.update(input.id, {
        ...input.data,
        imageId: image?.id ?? null,
      })

      if (oldImageId !== null) {
        await cleanupImage(ctx, oldImageId)
      }

      return playlist
    }),
  editTrackOrder: publicProcedure
    .input(z.object({ playlistId: z.number(), playlistTrackIds: z.number().array() }))
    .mutation(({ ctx, input }) => {
      ctx.db.playlists.updateTrackOrder(input.playlistTrackIds)
      return ctx.db.playlists.getWithTracks(input.playlistId)
    }),
})
