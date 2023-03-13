import { z } from 'zod'

import { ifDefined } from '$lib/utils/types'

import { insertArtist } from '../db/operations/artists'
import {
  getAllReleases,
  getReleaseWithArtistsById,
  updateReleaseWithArtists,
} from '../db/operations/releases'
import { getTracksByReleaseId } from '../db/operations/tracks'
import { publicProcedure, router } from '../trpc'
import { getMetadataFromTrack, writeTrackMetadata } from '../utils/music-metadata'

export const releasesRouter = router({
  getAll: publicProcedure.query(() =>
    getAllReleases().map((release) => ({
      ...release,
      hasCoverArt: getTracksByReleaseId(release.id).some((track) => track.hasCoverArt),
    }))
  ),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id } }) => getReleaseWithArtistsById(id)),
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

      const release = updateReleaseWithArtists(id, { ...data, artists })
      const tracks = getTracksByReleaseId(release.id)

      await Promise.all(
        tracks.map((track) => writeTrackMetadata(track.path, getMetadataFromTrack(track.id)))
      )

      return release
    }),
})
