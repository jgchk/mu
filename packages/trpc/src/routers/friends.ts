import { publicProcedure, router } from '../trpc'

type LastTrack = {
  title: string
  url: string
  artist: string
  artistUrl: string
  album: string
  art?: string
} & ({ nowPlaying: true } | { nowPlaying: false; date: Date })

export const friendsRouter = router({
  getLastListened: publicProcedure.query(async ({ ctx }) => {
    const friends = await ctx.lfm.getFriends()

    const lastTracks = await Promise.all(
      friends.map(async (friend) => {
        const lastTracks = await ctx.lfm.getRecentTracks(friend.name)
        const lastTrack = lastTracks[0]
        const nowPlaying = '@attr' in lastTrack ? lastTrack['@attr'].nowplaying === 'true' : false

        const baseData = {
          title: lastTrack.name,
          url: lastTrack.url,
          artist: lastTrack.artist.name,
          artistUrl: lastTrack.artist.url,
          album: lastTrack.album['#text'],
          art: lastTrack.image.find((img) => img.size === 'large')?.['#text'],
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

        return {
          friend,
          lastTrack: data,
        }
      })
    )

    return lastTracks.sort((a, b) => {
      if (a.lastTrack.nowPlaying) {
        return -1
      }
      if (b.lastTrack.nowPlaying) {
        return 1
      }

      return b.lastTrack.date.getTime() - a.lastTrack.date.getTime()
    })
  }),
})
