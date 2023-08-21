import type { RouterInput } from '$lib/trpc'

export type TrackListTrack = {
  id: number
  imageId: number | null
  title: string | null
  duration: number
  favorite: boolean
  release?: { id: number; title: string | null } | null
  artists: { id: number; name: string }[]
  playlistTrackId?: number
}

export type Sort = NonNullable<RouterInput['tracks']['getAll']['sort']>
