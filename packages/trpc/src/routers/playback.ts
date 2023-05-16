import { ifNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { isLastFmLoggedIn } from '../trpc/middleware'

export const playbackRouter = router({
  updateNowPlaying: protectedProcedure
    .input(z.object({ id: z.number() }))
    .use(isLastFmLoggedIn)
    .mutation(({ ctx, input }) => {
      const track = ctx.sys().db.tracks.get(input.id)
      const artists = ctx
        .sys()
        .db.artists.getByTrackId(track.id)
        .map((a) => a.name)
        .join(', ')

      const release = ifNotNull(track.releaseId, (releaseId) => {
        const release = ctx.sys().db.releases.get(releaseId)
        const artists = ctx.sys().db.artists.getByReleaseId(releaseId)
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
        trackNumber: track.order + 1,
        duration: track.duration / 1000,
        albumArtist: albumArtists ?? undefined,
      })
    }),

  scrobble: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        timestamp: z.date(),
      })
    )
    .use(isLastFmLoggedIn)
    .mutation(({ ctx, input }) => {
      const track = ctx.sys().db.tracks.get(input.id)
      const artists = ctx
        .sys()
        .db.artists.getByTrackId(track.id)
        .map((a) => a.name)
        .join(', ')

      const release = ifNotNull(track.releaseId, (releaseId) => {
        const release = ctx.sys().db.releases.get(releaseId)
        const artists = ctx.sys().db.artists.getByReleaseId(releaseId)
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
        trackNumber: track.order + 1,
        albumArtist: albumArtists ?? undefined,
        duration: track.duration / 1000,
        timestamp: input.timestamp,
      })
    }),
})
