import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { ifNotNull } from '../utils/types'

export const playbackRouter = router({
  updateNowPlaying: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      const dbTrack = ctx.db.tracks.getWithArtists(input.id)

      const artists = dbTrack.artists
        .sort((a, b) => a.order - b.order)
        .map((artist) => artist.name)
        .join(', ')

      const release = ifNotNull(dbTrack.releaseId, (releaseId) =>
        ctx.db.releases.getWithArtists(releaseId)
      )

      const albumArtists = ifNotNull(release, (release) =>
        release.artists
          .sort((a, b) => a.order - b.order)
          .map((artist) => artist.name)
          .join(', ')
      )

      return ctx.lfm.updateNowPlaying({
        artist: artists,
        track: dbTrack.title ?? '[untitled]',
        album: release?.title ?? undefined,
        trackNumber:
          ifNotNull(dbTrack.trackNumber, (trackNumber) => trackNumber.toString()) ?? undefined,
        duration: dbTrack.duration / 1000,
        albumArtist: albumArtists ?? undefined,
      })
    }),

  scrobble: publicProcedure
    .input(
      z.object({
        id: z.number(),
        timestamp: z.date(),
      })
    )
    .mutation(({ ctx, input }) => {
      const dbTrack = ctx.db.tracks.getWithArtists(input.id)

      const artists = dbTrack.artists
        .sort((a, b) => a.order - b.order)
        .map((artist) => artist.name)
        .join(', ')

      const release = ifNotNull(dbTrack.releaseId, (releaseId) =>
        ctx.db.releases.getWithArtists(releaseId)
      )

      const albumArtists = ifNotNull(release, (release) =>
        release.artists
          .sort((a, b) => a.order - b.order)
          .map((artist) => artist.name)
          .join(', ')
      )

      return ctx.lfm.scrobble({
        artist: artists,
        track: dbTrack.title ?? '[untitled]',
        album: release?.title ?? undefined,
        trackNumber:
          ifNotNull(dbTrack.trackNumber, (trackNumber) => trackNumber.toString()) ?? undefined,
        albumArtist: albumArtists ?? undefined,
        duration: dbTrack.duration / 1000,
        timestamp: input.timestamp,
      })
    }),
})
