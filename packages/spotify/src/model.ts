import { z } from 'zod';

export type SimplifiedArtist = z.infer<typeof SimplifiedArtist>;
export const SimplifiedArtist = z.object({
  type: z.literal('artist'),
  id: z.string(),
  name: z.string()
});

export type Image = z.infer<typeof Image>;
export const Image = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number()
});

export type SimplifiedAlbum = z.infer<typeof SimplifiedAlbum>;
export const SimplifiedAlbum = z.object({
  type: z.literal('album'),
  id: z.string(),
  name: z.string(),
  artists: SimplifiedArtist.array(),
  images: Image.array()
});

export type FullAlbum = z.infer<typeof FullAlbum>;
export const FullAlbum = SimplifiedAlbum;

export type SimplifiedTrack = z.infer<typeof SimplifiedTrack>;
export const SimplifiedTrack = z.object({
  type: z.literal('track'),
  id: z.string(),
  name: z.string(),
  artists: SimplifiedArtist.array()
});

export type FullTrack = z.infer<typeof FullTrack>;
export const FullTrack = SimplifiedTrack.extend({
  album: SimplifiedAlbum
});

export type Pager<T> = Omit<z.infer<ReturnType<typeof Pager>>, 'items'> & { items: T[] };
export const Pager = <T extends z.ZodTypeAny>(itemType: T) =>
  z.object({
    items: itemType.array(),
    href: z.string(),
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable()
  });

export type SearchTracks = z.infer<typeof SearchTracks>;
export const SearchTracks = z.object({
  tracks: Pager(FullTrack)
});

export type SearchAlbums = z.infer<typeof SearchAlbums>;
export const SearchAlbums = z.object({
  albums: Pager(SimplifiedAlbum)
});

export type SearchTracksAndAlbums = z.infer<typeof SearchTracksAndAlbums>;
export const SearchTracksAndAlbums = SearchTracks.and(SearchAlbums);