import { writeTrackMetadata } from 'music-metadata'
import { z } from 'zod'

import { getMetadataFromTrack } from '../services/music-metadata'
import { publicProcedure, router } from '../trpc'
import { ifDefined } from '../utils/types'

export const releasesRouter = router({
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.releases.getAll().map((release) => ({
      ...release,
      hasCoverArt: ctx.db.tracks.getByReleaseId(release.id).some((track) => track.hasCoverArt),
    }))
  ),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => ctx.db.releases.getWithArtists(id)),
  updateMetadata: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string(),
          artists: z.union([z.number(), z.string()]).array().optional(),
        }),
      })
    )
    .mutation(async ({ input: { id, data }, ctx }) => {
      const artists = ifDefined(data.artists, (artists) =>
        artists.map((artist) => {
          if (typeof artist === 'number') {
            return artist
          } else {
            return ctx.db.artists.insert({ name: artist }).id
          }
        })
      )

      const release = ctx.db.releases.updateWithArtists(id, { ...data, artists })
      const tracks = ctx.db.tracks.getByReleaseId(release.id)

      await Promise.all(
        tracks.map((track) =>
          writeTrackMetadata(track.path, getMetadataFromTrack(ctx.db, track.id))
        )
      )

      return release
    }),
})
