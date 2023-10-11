import type { RouterOutput } from '$lib/trpc'

export type SearchResult = TrackResult | ReleaseResult | ArtistResult | PlaylistResult | TagResult

type TrackResult = RouterOutput['tracks']['getAll']['items'][number] & { kind: 'track' }
type ReleaseResult = RouterOutput['releases']['getAll']['items'][number] & { kind: 'release' }
type ArtistResult = RouterOutput['artists']['getAll'][number] & { kind: 'artist' }
type PlaylistResult = RouterOutput['playlists']['getAll'][number] & { kind: 'playlist' }
type TagResult = RouterOutput['tags']['getAll'][number] & { kind: 'tag' }

export const getTitle = (result: SearchResult) => {
  switch (result.kind) {
    case 'track':
      return result.title ?? '[untitled]'
    case 'release':
      return result.title ?? '[untitled]'
    case 'artist':
      return result.name
    case 'playlist':
      return result.name
    case 'tag':
      return result.name
  }
}
