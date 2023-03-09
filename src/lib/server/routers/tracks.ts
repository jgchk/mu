import { z } from 'zod'
import { getAllTracks, getTrackById } from '../db/operations'
import { publicProcedure, router } from '../trpc'
import { updateTrack } from '../db/operations'
import { getMetadataFromDatabaseTrack, writeFile } from '../utils/music-metadata'

export const tracksRouter = router({
  getAll: publicProcedure.query(() => getAllTracks()),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id } }) => getTrackById(id)),
  updateMetadata: publicProcedure
    .input(z.object({ id: z.number(), metadata: z.object({ title: z.string().nullish() }) }))
    .mutation(async ({ input: { id, metadata } }) => {
      const track = updateTrack(id, metadata)
      await writeFile(track.path, getMetadataFromDatabaseTrack(track))
      return track
    }),
})

export type AppRouter = typeof tracksRouter
