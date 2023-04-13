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

export type NowPlaying = z.infer<typeof NowPlaying>
export const NowPlaying = z.object({
  nowplaying: z.object({
    artist: z.object({ corrected: z.string(), '#text': z.string() }),
    track: z.object({ corrected: z.string(), '#text': z.string() }),
    ignoredMessage: z.object({ code: z.string(), '#text': z.string() }),
    albumArtist: z.object({ corrected: z.string(), '#text': z.string() }),
    album: z.object({ corrected: z.string(), '#text': z.string() }),
  }),
})

export type Scrobble = z.infer<typeof Scrobble>
export const Scrobble = z.object({
  scrobbles: z.object({
    scrobble: z.object({
      artist: z.object({ corrected: z.string(), '#text': z.string() }),
      album: z.object({ corrected: z.string(), '#text': z.string() }),
      track: z.object({ corrected: z.string(), '#text': z.string() }),
      ignoredMessage: z.object({ code: z.string(), '#text': z.string() }),
      albumArtist: z.object({ corrected: z.string(), '#text': z.string() }),
      timestamp: z.string(),
    }),
    '@attr': z.object({ ignored: z.number(), accepted: z.number() }),
  }),
})

export type LovedTracks = z.infer<typeof LovedTracks>
export const LovedTracks = z.object({
  lovedtracks: z.object({
    track: z
      .object({
        artist: z.object({
          url: z.string(),
          name: z.string(),
          mbid: z.string(),
        }),
        date: z.object({ uts: z.string(), '#text': z.string() }),
        mbid: z.string(),
        url: z.string(),
        name: z.string(),
        image: z.array(z.object({ size: z.string(), '#text': z.string() })),
        streamable: z.object({ fulltrack: z.string(), '#text': z.string() }),
      })
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

export type TrackInfo = z.infer<typeof TrackInfo>
export const TrackInfo = z.object({
  track: z.object({
    name: z.string(),
    mbid: z.string().optional(),
    url: z.string(),
    duration: z.string(),
    streamable: z.object({ '#text': z.string(), fulltrack: z.string() }),
    listeners: z.string(),
    playcount: z.string(),
    artist: z.object({ name: z.string(), mbid: z.string().optional(), url: z.string() }),
    album: z
      .object({
        artist: z.string(),
        title: z.string(),
        mbid: z.string().optional(),
        url: z.string(),
        image: z.array(z.object({ '#text': z.string(), size: z.string() })),
        '@attr': z.object({ position: z.string() }).optional(),
      })
      .optional(),
    toptags: z.object({
      tag: z.array(z.object({ name: z.string(), url: z.string() })),
    }),
    wiki: z
      .object({
        published: z.string(),
        summary: z.string(),
        content: z.string(),
      })
      .optional(),
  }),
})

export type TrackInfoUser = z.infer<typeof TrackInfoUser>
export const TrackInfoUser = TrackInfo.and(
  z.object({
    track: z.object({
      userplaycount: z.string(),
      userloved: z.string(),
    }),
  })
)
