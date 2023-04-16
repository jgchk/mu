import { ifDefined, undefIfEmpty, withinLastMinutes } from 'utils'

import { isLastFmLoggedIn, isSpotifyFriendActivityAvailable } from '../middleware'
import { publicProcedure, router } from '../trpc'

type LastTrack = {
  title: string
  url: string
  artist: string
  artistUrl: string
  album?: string
  albumUrl?: string
  friendName: string
  friendUrl: string
  art?: string
} & ({ nowPlaying: true } | { nowPlaying: false; date: Date })

export const friendsRouter = router({
  lastFm: publicProcedure.use(isLastFmLoggedIn).query(async ({ ctx }) => {
    const friends = await ctx.lfm.getFriends()

    const lastTracks = await Promise.all(
      friends.map(async (friend) => {
        const lastTracks = await ctx.lfm.getRecentTracks(friend.name)
        const lastTrack = lastTracks[0]
        const nowPlaying = '@attr' in lastTrack ? lastTrack['@attr'].nowplaying === 'true' : false

        const album = undefIfEmpty(lastTrack.album['#text'])
        const baseData = {
          title: lastTrack.name,
          url: lastTrack.url,
          artist: lastTrack.artist.name,
          artistUrl: lastTrack.artist.url,
          album,
          albumUrl: ifDefined(
            album,
            (album) =>
              `https://www.last.fm/music/${encodeURIComponent(
                lastTrack.artist.name
              )}/${encodeURIComponent(album)}`
          ),
          friendName: friend.name,
          friendUrl: friend.url,
          art: ifDefined(
            lastTrack.image.find((img) => img.size === 'large')?.['#text'],
            undefIfEmpty
          ),
        }

        let data: LastTrack
        if (nowPlaying) {
          data = {
            ...baseData,
            nowPlaying: true,
          }
        } else {
          if (!('date' in lastTrack)) {
            throw new Error('Expected date')
          }

          data = {
            ...baseData,
            nowPlaying: false,
            date: new Date(parseInt(lastTrack.date.uts, 10) * 1000),
          }
        }

        return data
      })
    )

    return lastTracks.sort((a, b) => {
      if (a.nowPlaying) {
        return -1
      }
      if (b.nowPlaying) {
        return 1
      }

      return b.date.getTime() - a.date.getTime()
    })
  }),
  spotify: publicProcedure.use(isSpotifyFriendActivityAvailable).query(async ({ ctx }) => {
    const friends = await ctx.sp.getFriendActivity()
    return friends.map((friend) => {
      const baseData = {
        title: friend.track.name,
        url: ctx.sp.uriToUrl(friend.track.uri),
        artist: friend.track.artist.name,
        artistUrl: ctx.sp.uriToUrl(friend.track.artist.uri),
        album: friend.track.album.name,
        albumUrl: ctx.sp.uriToUrl(friend.track.album.uri),
        friendName: friend.user.name,
        friendUrl: ctx.sp.uriToUrl(friend.user.uri),
        art: friend.track.imageUrl,
      }

      const date = new Date(friend.timestamp)
      const nowPlaying = withinLastMinutes(date, 5)

      let data: LastTrack
      if (nowPlaying) {
        data = {
          ...baseData,
          nowPlaying: true,
        }
      } else {
        data = {
          ...baseData,
          nowPlaying: false,
          date,
        }
      }

      return data
    })
  }),
})
