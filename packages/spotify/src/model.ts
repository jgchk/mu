import { z } from 'zod'

export type AuthResponse = z.infer<typeof AuthResponse>
export const AuthResponse = z.object({
  access_token: z.string(),
})

export type WebTokenResponse = z.infer<typeof WebTokenResponse>
export const WebTokenResponse = z.object({
  accessToken: z.string(),
})

export type SimplifiedArtist = z.infer<typeof SimplifiedArtist>
export const SimplifiedArtist = z.object({
  type: z.literal('artist'),
  id: z.string(),
  name: z.string(),
})

export type Image = z.infer<typeof Image>
export const Image = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
})

export type SimplifiedAlbum = z.infer<typeof SimplifiedAlbum>
export const SimplifiedAlbum = z.object({
  type: z.literal('album'),
  id: z.string(),
  name: z.string(),
  artists: SimplifiedArtist.array(),
  images: Image.array(),
})

export type FullAlbum = z.infer<typeof FullAlbum>
export const FullAlbum = SimplifiedAlbum

export type SimplifiedTrack = z.infer<typeof SimplifiedTrack>
export const SimplifiedTrack = z.object({
  type: z.literal('track'),
  id: z.string(),
  name: z.string(),
  artists: SimplifiedArtist.array(),
  track_number: z.number(),
})

export type FullTrack = z.infer<typeof FullTrack>
export const FullTrack = SimplifiedTrack.extend({
  album: SimplifiedAlbum,
})

export type Pager<T> = Omit<z.infer<ReturnType<typeof Pager>>, 'items'> & { items: T[] }
export const Pager = <T extends z.ZodTypeAny>(itemType: T) =>
  z.object({
    items: itemType.array(),
    href: z.string(),
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
  })

export type FriendActivity = z.infer<typeof FriendActivity>
export const FriendActivity = z.object({
  friends: z
    .union([
      z.object({
        timestamp: z.number(),
        user: z.object({
          uri: z.string(),
          name: z.string(),
          imageUrl: z.string(),
        }),
        track: z.object({
          uri: z.string(),
          name: z.string(),
          imageUrl: z.string(),
          album: z.object({ uri: z.string(), name: z.string() }),
          artist: z.object({ uri: z.string(), name: z.string() }),
          context: z.object({
            uri: z.string(),
            name: z.string(),
            index: z.number(),
          }),
        }),
      }),
      z.object({
        timestamp: z.number(),
        user: z.object({ uri: z.string(), name: z.string() }),
        track: z.object({
          uri: z.string(),
          name: z.string(),
          imageUrl: z.string(),
          album: z.object({ uri: z.string(), name: z.string() }),
          artist: z.object({ uri: z.string(), name: z.string() }),
          context: z.object({
            uri: z.string(),
            name: z.string(),
            index: z.number(),
          }),
        }),
      }),
    ])
    .array(),
})
