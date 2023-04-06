import { z } from 'zod'

export type MobileSession = z.infer<typeof MobileSession>
export const MobileSession = z.object({
  session: z.object({
    key: z.string(),
  }),
})

export type Friends = z.infer<typeof Friends>
export const Friends = z.object({
  friends: z.object({
    '@attr': z.object({
      user: z.string(),
      totalPages: z.string(),
      page: z.string(),
      perPage: z.string(),
      total: z.string(),
    }),
    user: z
      .object({
        name: z.string(),
        url: z.string(),
        country: z.string(),
        playlists: z.string(),
        playcount: z.string(),
        image: z.object({ size: z.string(), '#text': z.string() }).array(),
        registered: z.object({ unixtime: z.string(), '#text': z.string() }),
        realname: z.string(),
        subscriber: z.string(),
        bootstrap: z.string(),
        type: z.string(),
      })
      .array(),
  }),
})

export type RecentTracks = z.infer<typeof RecentTracks>
export const RecentTracks = z.object({
  recenttracks: z.object({
    track: z
      .object({
        artist: z.object({
          url: z.string(),
          name: z.string(),
          image: z.array(z.object({ size: z.string(), '#text': z.string() })),
          mbid: z.string(),
        }),
        mbid: z.string(),
        name: z.string(),
        image: z.object({ size: z.string(), '#text': z.string() }).array(),
        streamable: z.string(),
        album: z.object({ mbid: z.string(), '#text': z.string() }),
        url: z.string(),
        loved: z.enum(['0', '1']),
      })
      .and(
        z.union([
          z.object({ '@attr': z.object({ nowplaying: z.literal('true') }) }),
          z.object({ date: z.object({ uts: z.string(), '#text': z.string() }) }),
        ])
      )
      .array(),
    '@attr': z.object({
      user: z.string(),
      totalPages: z.string(),
      page: z.string(),
      perPage: z.string(),
      total: z.string(),
    }),
  }),
})
