import { z } from 'zod'

export type Alias = z.infer<typeof Alias>
export const Alias = z.object({
  'sort-name': z.string(),
  name: z.string(),
  locale: z.string().nullable(),
  type: z.string().nullable(),
  primary: z.boolean().nullable(),
  'begin-date': z.string().nullable(),
  'end-date': z.string().nullable(),
})

export type Artist = z.infer<typeof Artist>
export const Artist = z.object({
  id: z.string(),
  name: z.string(),
  'sort-name': z.string(),
  aliases: Alias.array().optional(),
})

export type ArtistCredit = z.infer<typeof ArtistCredit>
export const ArtistCredit = z.object({
  artist: Artist,
})

export type ReleaseGroup = z.infer<typeof ReleaseGroup>
export const ReleaseGroup = z.object({
  id: z.string(),
  'primary-type': z.string().optional(),
})

export type Medium = z.infer<typeof Medium>
export const Medium = z.object({
  format: z.string().optional(),
  'disc-count': z.number(),
  'track-count': z.number(),
})

export type Release = z.infer<typeof Release>
export const Release = z.object({
  id: z.string(),
  count: z.number(),
  title: z.string(),
  'status-id': z.string().optional(),
  status: z.string().optional(),
  'artist-credit': ArtistCredit.array(),
  'release-group': ReleaseGroup,
  date: z.string().optional(),
  country: z.string().optional(),
  'track-count': z.number(),
  media: Medium.array(),
})

export type SearchResults = z.infer<typeof SearchResults>
export const SearchResults = z.object({
  created: z.string().datetime(),
  count: z.number(),
  offset: z.number(),
})

export type ReleaseResult = z.infer<typeof ReleaseResult>
export const ReleaseResult = Release.extend({ score: z.number() })

export type SearchReleaseResults = z.infer<typeof SearchReleaseResults>
export const SearchReleaseResults = SearchResults.extend({
  releases: ReleaseResult.array(),
})

export type Image = z.infer<typeof Image>
export const Image = z.object({
  types: z.string().array(),
  front: z.boolean(),
  back: z.boolean(),
  edit: z.number(),
  image: z.string().url(),
  comment: z.string(),
  approved: z.boolean(),
  id: z.union([z.number(), z.string()]),
  thumbnails: z.record(z.string().url()),
})

export type Images = z.infer<typeof Images>
export const Images = z.object({
  images: Image.array(),
  release: z.string().url(),
})
