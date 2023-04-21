import { ifNotNull } from 'utils'
import { z } from 'zod'

import { isLastFmLoggedIn } from '../middleware'
import { publicProcedure, router } from '../trpc'

export const playbackRouter = router({
  updateNowPlaying: publicProcedure
    .input(z.object({ id: z.number() }))
    .use(isLastFmLoggedIn)
    .mutation(({ ctx, input }) => {
      const track = ctx.db.tracks.get(input.id)
      const artists = ctx.db.artists
        .getByTrackId(track.id)
        .map((a) => a.name)
        .join(', ')

      const release = ifNotNull(track.releaseId, (releaseId) => {
        const release = ctx.db.releases.get(releaseId)
        const artists = ctx.db.artists.getByReleaseId(releaseId)
        return {
          ...release,
          artists,
        }
      })

      const albumArtists = ifNotNull(release, (release) =>
        release.artists.map((a) => a.name).join(', ')
      )

      return ctx.lfm.updateNowPlaying({
        artist: artists,
        track: track.title ?? '[untitled]',
        album: release?.title ?? undefined,
        trackNumber:
          ifNotNull(track.trackNumber, (trackNumber) => trackNumber.toString()) ?? undefined,
        duration: track.duration / 1000,
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
    .use(isLastFmLoggedIn)
    .mutation(({ ctx, input }) => {
      const track = ctx.db.tracks.get(input.id)
      const artists = ctx.db.artists
        .getByTrackId(track.id)
        .map((a) => a.name)
        .join(', ')

      const release = ifNotNull(track.releaseId, (releaseId) => {
        const release = ctx.db.releases.get(releaseId)
        const artists = ctx.db.artists.getByReleaseId(releaseId)
        return {
          ...release,
          artists,
        }
      })

      const albumArtists = ifNotNull(release, (release) =>
        release.artists.map((artist) => artist.name).join(', ')
      )

      return ctx.lfm.scrobble({
        artist: artists,
        track: track.title ?? '[untitled]',
        album: release?.title ?? undefined,
        trackNumber:
          ifNotNull(track.trackNumber, (trackNumber) => trackNumber.toString()) ?? undefined,
        albumArtist: albumArtists ?? undefined,
        duration: track.duration / 1000,
        timestamp: input.timestamp,
      })
    }),
})
