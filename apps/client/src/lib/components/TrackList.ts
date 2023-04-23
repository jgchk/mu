export type TrackListTrack = {
  id: number
  imageId: number | null
  title: string | null
  duration: number
  favorite: boolean
  release?: { id: number; title: string | null } | null
  artists: { id: number; name: string }[]
}
