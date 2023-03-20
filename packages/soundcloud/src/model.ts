import { z } from 'zod';

export type Pager<T> = { collection: T[] };
export const Pager = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    collection: item.array()
  });

export type Transcoding = z.infer<typeof Transcoding>;
export const Transcoding = z.object({
  url: z.string(),
  preset: z.string(),
  duration: z.number(),
  snipped: z.boolean(),
  format: z.object({
    protocol: z.string(),
    mime_type: z.string()
  }),
  quality: z.string()
});

export type User = z.infer<typeof User>;
export const User = z.object({
  username: z.string()
});

export type SimplifiedTrack = z.infer<typeof SimplifiedTrack>;
export const SimplifiedTrack = z.object({
  id: z.number(),
  kind: z.literal('track')
});

export type FullTrack = z.infer<typeof FullTrack>;
export const FullTrack = SimplifiedTrack.extend({
  artwork_url: z.string().nullable(),
  title: z.string(),
  user: User,
  streamable: z.boolean(),
  policy: z.string(),
  downloadable: z.boolean(),
  media: z.object({
    transcodings: Transcoding.array()
  })
});

export type Playlist = z.infer<typeof Playlist>;
export const Playlist = z.object({
  id: z.number(),
  kind: z.literal('playlist'),
  artwork_url: z.string().nullable(),
  title: z.string(),
  user: User,
  tracks: z.union([FullTrack, SimplifiedTrack]).array()
});

export type DownloadResponse = z.infer<typeof DownloadResponse>;
export const DownloadResponse = z.object({
  redirectUri: z.string()
});

export type TranscodingResponse = z.infer<typeof TranscodingResponse>;
export const TranscodingResponse = z.object({
  url: z.string()
});
