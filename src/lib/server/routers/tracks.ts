import { ifDefined } from '$lib/utils/types'
import { z } from 'zod'
import { insertArtist } from '../db/operations/artists'
import {
  getAllTracks,
  getTrackWithArtistsById,
  updateTrackWithArtists,
} from '../db/operations/tracks'
import { publicProcedure, router } from '../trpc'
import { getMetadataFromTrack, writeFile } from '../utils/music-metadata'

export const tracksRouter = router({
  getAll: publicProcedure.query(() => getAllTracks()),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id } }) => getTrackWithArtistsById(id)),
  updateMetadata: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().nullish(),
          artists: z.union([z.number(), z.string()]).array().optional(),
        }),
      })
    )
    .mutation(async ({ input: { id, data } }) => {
      const artists = ifDefined(data.artists, (artists) =>
        artists.map((artist) => {
          if (typeof artist === 'number') {
            return artist
          } else {
            return insertArtist({ name: artist }).id
          }
        })
      )
      const track = updateTrackWithArtists(id, { ...data, artists })
      await writeFile(track.path, getMetadataFromTrack(track))
      return track
    }),
})

export type AppRouter = typeof tracksRouter
